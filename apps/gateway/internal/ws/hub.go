package ws

import (
	"encoding/json"
	"sync"

	"github.com/gofiber/websocket/v2"
	"github.com/rs/zerolog/log"
)

// Message represents a WebSocket message
type Message struct {
	Type string      `json:"type"`
	Data interface{} `json:"data,omitempty"`
}

// Hub manages all WebSocket connections
type Hub struct {
	mu sync.RWMutex
	// userID -> set of connections
	connections map[string]map[*websocket.Conn]bool
	// role -> set of userIDs
	roleMap map[string]map[string]bool
}

// Global hub instance
var GlobalHub = NewHub()

func NewHub() *Hub {
	return &Hub{
		connections: make(map[string]map[*websocket.Conn]bool),
		roleMap: map[string]map[string]bool{
			"officer": {},
			"bidder":  {},
			"admin":   {},
		},
	}
}

func (h *Hub) Register(conn *websocket.Conn, userID, role string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.connections[userID]; !ok {
		h.connections[userID] = make(map[*websocket.Conn]bool)
	}
	h.connections[userID][conn] = true

	if _, ok := h.roleMap[role]; ok {
		h.roleMap[role][userID] = true
	}

	log.Info().Str("user", userID).Str("role", role).Int("total", h.totalConns()).Msg("WebSocket connected")
}

func (h *Hub) Unregister(conn *websocket.Conn, userID, role string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if conns, ok := h.connections[userID]; ok {
		delete(conns, conn)
		if len(conns) == 0 {
			delete(h.connections, userID)
			if roleSet, ok := h.roleMap[role]; ok {
				delete(roleSet, userID)
			}
		}
	}

	log.Info().Str("user", userID).Msg("WebSocket disconnected")
}

// SendToUser sends a message to all connections of a specific user
func (h *Hub) SendToUser(userID string, msg Message) {
	h.mu.RLock()
	conns, ok := h.connections[userID]
	if !ok {
		h.mu.RUnlock()
		return
	}
	// Copy slice under read lock
	connList := make([]*websocket.Conn, 0, len(conns))
	for c := range conns {
		connList = append(connList, c)
	}
	h.mu.RUnlock()

	data, err := json.Marshal(msg)
	if err != nil {
		log.Error().Err(err).Msg("Failed to marshal WS message")
		return
	}

	for _, c := range connList {
		if err := c.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Warn().Err(err).Str("user", userID).Msg("Failed to send WS message")
		}
	}
}

// BroadcastToRole sends a message to all users with a specific role
func (h *Hub) BroadcastToRole(role string, msg Message) {
	h.mu.RLock()
	roleSet, ok := h.roleMap[role]
	if !ok {
		h.mu.RUnlock()
		return
	}
	userIDs := make([]string, 0, len(roleSet))
	for uid := range roleSet {
		userIDs = append(userIDs, uid)
	}
	h.mu.RUnlock()

	for _, uid := range userIDs {
		h.SendToUser(uid, msg)
	}
}

// Broadcast sends a message to all connected users
func (h *Hub) Broadcast(msg Message) {
	h.mu.RLock()
	userIDs := make([]string, 0, len(h.connections))
	for uid := range h.connections {
		userIDs = append(userIDs, uid)
	}
	h.mu.RUnlock()

	for _, uid := range userIDs {
		h.SendToUser(uid, msg)
	}
}

func (h *Hub) totalConns() int {
	total := 0
	for _, conns := range h.connections {
		total += len(conns)
	}
	return total
}

func (h *Hub) ActiveCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.totalConns()
}
