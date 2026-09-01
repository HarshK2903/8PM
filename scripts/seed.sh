#!/usr/bin/env bash
# ============================================
# GemVerify — Database Seeder
# Seeds demo data: users, tenders, bids, mock registry
# ============================================

set -e

API="http://localhost:8000/api"
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🌱 Seeding GemVerify database...${NC}\n"

# --- Create Officer ---
echo -e "${GREEN}Creating Officer account...${NC}"
OFFICER=$(curl -s -X POST "$API/auth/register" -H "Content-Type: application/json" -d '{
  "email": "officer@gem.gov.in",
  "password": "officer123",
  "full_name": "Dr. Rajesh Kumar",
  "role": "officer",
  "organization": "Ministry of Defence"
}')
OFFICER_TOKEN=$(echo $OFFICER | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
echo "  Officer token: ${OFFICER_TOKEN:0:20}..."

# --- Create Bidders ---
echo -e "\n${GREEN}Creating Bidder accounts...${NC}"

BIDDER1=$(curl -s -X POST "$API/auth/register" -H "Content-Type: application/json" -d '{
  "email": "amit@techcorp.in",
  "password": "bidder123",
  "full_name": "Amit Sharma",
  "role": "bidder",
  "organization": "TechCorp Solutions Pvt Ltd"
}')
B1_TOKEN=$(echo $BIDDER1 | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
echo "  Bidder 1 (TechCorp): created"

BIDDER2=$(curl -s -X POST "$API/auth/register" -H "Content-Type: application/json" -d '{
  "email": "priya@greenenergy.in",
  "password": "bidder123",
  "full_name": "Priya Patel",
  "role": "bidder",
  "organization": "Green Energy Systems LLP"
}')
B2_TOKEN=$(echo $BIDDER2 | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
echo "  Bidder 2 (Green Energy): created"

BIDDER3=$(curl -s -X POST "$API/auth/register" -H "Content-Type: application/json" -d '{
  "email": "rahul@bharathdef.in",
  "password": "bidder123",
  "full_name": "Rahul Verma",
  "role": "bidder",
  "organization": "Bharath Defence Electronics"
}')
B3_TOKEN=$(echo $BIDDER3 | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
echo "  Bidder 3 (Bharath Defence): created"

# --- Create Tenders ---
echo -e "\n${GREEN}Creating Tenders...${NC}"

T1=$(curl -s -X POST "$API/tenders" -H "Content-Type: application/json" -H "Authorization: Bearer $OFFICER_TOKEN" -d '{
  "title": "Supply of IT Hardware & Network Equipment",
  "description": "Procurement of 500 desktop computers, 200 laptops, networking equipment and peripherals for Ministry of Defence offices across India. Must comply with Make in India policy.",
  "tender_type": "open",
  "department": "Defence",
  "category": "IT Hardware",
  "estimated_value": 25000000,
  "emd_amount": 500000,
  "required_documents": ["udyam", "gst", "pan", "income_tax", "epfo", "make_in_india", "oem_authorization"],
  "make_in_india_required": true,
  "msme_required": true,
  "min_turnover": 10000000,
  "local_content_percentage": 50,
  "submission_deadline": "2026-09-30T23:59:59Z"
}')
echo "  Tender 1 (IT Hardware): $(echo $T1 | python3 -c "import sys,json; print(json.load(sys.stdin).get('reference_number','created'))" 2>/dev/null)"

T2=$(curl -s -X POST "$API/tenders" -H "Content-Type: application/json" -H "Authorization: Bearer $OFFICER_TOKEN" -d '{
  "title": "Solar Panel Installation — Government Buildings",
  "description": "Installation of 5MW solar power systems across 50 government buildings in Delhi NCR. Startup India certified vendors preferred.",
  "tender_type": "open",
  "department": "Renewable Energy",
  "category": "Solar Energy",
  "estimated_value": 50000000,
  "emd_amount": 1000000,
  "required_documents": ["udyam", "gst", "pan", "income_tax", "startup_certificate", "nsic"],
  "startup_required": true,
  "msme_required": false,
  "min_turnover": 5000000,
  "submission_deadline": "2026-10-15T23:59:59Z"
}')
echo "  Tender 2 (Solar Panels): $(echo $T2 | python3 -c "import sys,json; print(json.load(sys.stdin).get('reference_number','created'))" 2>/dev/null)"

T3=$(curl -s -X POST "$API/tenders" -H "Content-Type: application/json" -H "Authorization: Bearer $OFFICER_TOKEN" -d '{
  "title": "Office Furniture Supply — Central Secretariat",
  "description": "Supply and installation of ergonomic office furniture for 1000 workstations at Central Secretariat complex, New Delhi.",
  "tender_type": "limited",
  "department": "General Administration",
  "category": "Furniture",
  "estimated_value": 8000000,
  "emd_amount": 160000,
  "required_documents": ["udyam", "gst", "pan", "company_registration"],
  "msme_required": true,
  "submission_deadline": "2026-09-20T23:59:59Z"
}')
echo "  Tender 3 (Furniture): $(echo $T3 | python3 -c "import sys,json; print(json.load(sys.stdin).get('reference_number','created'))" 2>/dev/null)"

T4=$(curl -s -X POST "$API/tenders" -H "Content-Type: application/json" -H "Authorization: Bearer $OFFICER_TOKEN" -d '{
  "title": "Cybersecurity Audit Services",
  "description": "Comprehensive cybersecurity audit and vulnerability assessment for critical government IT infrastructure across 10 ministries.",
  "tender_type": "two_part",
  "department": "Electronics & IT",
  "category": "Cybersecurity",
  "estimated_value": 15000000,
  "emd_amount": 300000,
  "required_documents": ["gst", "pan", "income_tax", "company_registration", "epfo", "esic"],
  "min_turnover": 20000000,
  "submission_deadline": "2026-10-01T23:59:59Z"
}')
echo "  Tender 4 (Cybersecurity): $(echo $T4 | python3 -c "import sys,json; print(json.load(sys.stdin).get('reference_number','created'))" 2>/dev/null)"

T5=$(curl -s -X POST "$API/tenders" -H "Content-Type: application/json" -H "Authorization: Bearer $OFFICER_TOKEN" -d '{
  "title": "Medical Equipment — District Hospitals",
  "description": "Procurement of diagnostic imaging equipment (X-ray, ultrasound, CT scanner) for 20 district hospitals across Maharashtra.",
  "tender_type": "open",
  "department": "Health & Family Welfare",
  "category": "Medical Equipment",
  "estimated_value": 100000000,
  "emd_amount": 2000000,
  "required_documents": ["gst", "pan", "income_tax", "company_registration", "oem_authorization", "bis"],
  "make_in_india_required": true,
  "local_content_percentage": 60,
  "min_turnover": 50000000,
  "submission_deadline": "2026-10-30T23:59:59Z"
}')
echo "  Tender 5 (Medical): $(echo $T5 | python3 -c "import sys,json; print(json.load(sys.stdin).get('reference_number','created'))" 2>/dev/null)"

echo -e "\n${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  ✅ Seeding complete!                     ║${NC}"
echo -e "${CYAN}║                                           ║${NC}"
echo -e "${CYAN}║  Officer:  officer@gem.gov.in / officer123║${NC}"
echo -e "${CYAN}║  Bidder 1: amit@techcorp.in / bidder123   ║${NC}"
echo -e "${CYAN}║  Bidder 2: priya@greenenergy.in / bidder123${NC}"
echo -e "${CYAN}║  Bidder 3: rahul@bharathdef.in / bidder123║${NC}"
echo -e "${CYAN}║                                           ║${NC}"
echo -e "${CYAN}║  5 tenders created and published          ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"
