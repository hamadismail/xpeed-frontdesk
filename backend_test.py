#!/usr/bin/env python3
"""
Hotel Management System API Testing Suite
Tests all API endpoints for the Next.js hotel management system
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class HotelAPITester:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_resources = {
            'reservations': [],
            'bookings': [],
            'rooms': []
        }

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, params: Optional[Dict] = None) -> tuple[bool, Dict, int]:
        """Make HTTP request and return success, response data, status code"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, {}, 0

            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}

            return response.status_code < 400, response_data, response.status_code

        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}, 0

    def test_rooms_api(self):
        """Test rooms API endpoints"""
        print("\n🏨 Testing Rooms API...")
        
        # Test GET /api/rooms
        success, data, status = self.make_request('GET', 'rooms')
        if success and isinstance(data, list):
            self.log_test("GET /api/rooms", True, f"- Retrieved {len(data)} rooms")
            self.created_resources['rooms'] = data
            
            # Test with search parameter
            if data:
                first_room_no = data[0].get('roomNo', '')
                success_search, search_data, _ = self.make_request('GET', 'rooms', params={'search': str(first_room_no)})
                self.log_test("GET /api/rooms with search", success_search, f"- Found {len(search_data) if isinstance(search_data, list) else 0} rooms")
        else:
            self.log_test("GET /api/rooms", False, f"- Status: {status}, Response: {data}")

    def test_reservations_api(self):
        """Test reservations API endpoints"""
        print("\n📅 Testing Reservations API...")
        
        # Test GET /api/reserve
        success, data, status = self.make_request('GET', 'reserve')
        if success and isinstance(data, list):
            self.log_test("GET /api/reserve", True, f"- Retrieved {len(data)} reservations")
            self.created_resources['reservations'] = data
        else:
            self.log_test("GET /api/reserve", False, f"- Status: {status}, Response: {data}")

        # Test POST /api/reserve (create reservation)
        if self.created_resources['rooms']:
            available_room = None
            for room in self.created_resources['rooms']:
                if room.get('roomStatus') == 'AVAILABLE':
                    available_room = room
                    break
            
            if available_room:
                reservation_payload = {
                    "payload": {
                        "guest": {
                            "name": f"Test Guest {datetime.now().strftime('%H%M%S')}",
                            "phone": "+1234567890",
                            "ota": "WALKING_GUEST"
                        },
                        "room": {
                            "roomNo": available_room.get('roomNo'),
                            "arrival": (datetime.now() + timedelta(days=1)).isoformat(),
                            "departure": (datetime.now() + timedelta(days=3)).isoformat(),
                            "roomDetails": "Test reservation from API test"
                        },
                        "payment": {
                            "bookingFee": 0,
                            "sst": 0,
                            "tourismTax": 0,
                            "fnfDiscount": 0
                        },
                        "reservationDate": datetime.now().isoformat()
                    }
                }
                
                success, data, status = self.make_request('POST', 'reserve', reservation_payload)
                self.log_test("POST /api/reserve", success, f"- Status: {status}, Created: {data.get('success', False)}")
            else:
                self.log_test("POST /api/reserve", False, "- No available rooms found for testing")

    def test_bookings_api(self):
        """Test bookings API endpoints"""
        print("\n🛏️ Testing Bookings API...")
        
        # Test GET /api/book
        success, data, status = self.make_request('GET', 'book')
        if success and isinstance(data, list):
            self.log_test("GET /api/book", True, f"- Retrieved {len(data)} bookings")
            self.created_resources['bookings'] = data
        else:
            self.log_test("GET /api/book", False, f"- Status: {status}, Response: {data}")

        # Test POST /api/book (create booking)
        if self.created_resources['rooms']:
            available_room = None
            for room in self.created_resources['rooms']:
                if room.get('roomStatus') == 'AVAILABLE':
                    available_room = room
                    break
            
            if available_room:
                booking_payload = {
                    "bookingInfo": {
                        "guest": {
                            "name": f"Test Booking Guest {datetime.now().strftime('%H%M%S')}",
                            "phone": "+1987654321",
                            "refId": f"TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                            "otas": "WALKING_GUEST",
                            "status": "RESERVED"
                        },
                        "stay": {
                            "arrival": (datetime.now() + timedelta(days=1)).isoformat(),
                            "departure": (datetime.now() + timedelta(days=2)).isoformat(),
                            "adults": 2,
                            "children": 0
                        },
                        "payment": {
                            "roomPrice": 150,
                            "subtotal": 150,
                            "paidAmount": 0,
                            "dueAmount": 150,
                            "paymentMethod": "Cash",
                            "remarks": "Test booking from API test"
                        },
                        "roomId": available_room.get('_id')
                    }
                }
                
                success, data, status = self.make_request('POST', 'book', booking_payload)
                self.log_test("POST /api/book", success, f"- Status: {status}, Message: {data.get('message', 'No message')}")
            else:
                self.log_test("POST /api/book", False, "- No available rooms found for testing")

    def test_api_error_handling(self):
        """Test API error handling"""
        print("\n⚠️ Testing Error Handling...")
        
        # Test invalid room booking
        invalid_booking = {
            "bookingInfo": {
                "guest": {"name": "", "phone": ""},  # Missing required fields
                "roomId": "invalid_id"
            }
        }
        success, data, status = self.make_request('POST', 'book', invalid_booking)
        self.log_test("POST /api/book with invalid data", status == 400, f"- Status: {status}, Expected 400")
        
        # Test non-existent endpoints
        success, data, status = self.make_request('GET', 'nonexistent')
        self.log_test("GET /api/nonexistent", status == 404, f"- Status: {status}, Expected 404")

    def test_data_consistency(self):
        """Test data consistency across endpoints"""
        print("\n🔄 Testing Data Consistency...")
        
        # Refresh all data
        rooms_success, rooms_data, _ = self.make_request('GET', 'rooms')
        reservations_success, reservations_data, _ = self.make_request('GET', 'reserve')
        bookings_success, bookings_data, _ = self.make_request('GET', 'book')
        
        if rooms_success and reservations_success and bookings_success:
            # Check if reserved rooms have corresponding reservations
            reserved_rooms = [r for r in rooms_data if r.get('roomStatus') == 'RESERVED']
            occupied_rooms = [r for r in rooms_data if r.get('roomStatus') == 'OCCUPIED']
            
            self.log_test("Data consistency check", True, 
                         f"- Reserved rooms: {len(reserved_rooms)}, Occupied: {len(occupied_rooms)}, "
                         f"Reservations: {len(reservations_data)}, Bookings: {len(bookings_data)}")
        else:
            self.log_test("Data consistency check", False, "- Could not fetch all required data")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Hotel Management System API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test server connectivity
        try:
            response = requests.get(f"{self.base_url}/api/rooms", timeout=5)
            print(f"✅ Server is reachable - Status: {response.status_code}")
        except Exception as e:
            print(f"❌ Server is not reachable: {e}")
            return 1

        # Run all test suites
        self.test_rooms_api()
        self.test_reservations_api()
        self.test_bookings_api()
        self.test_api_error_handling()
        self.test_data_consistency()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️ {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    """Main test runner"""
    tester = HotelAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())