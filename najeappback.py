"""
Naje Fast Food Web Application Backend
Framework: Flask (RESTful Modular Blueprint API)
Design Principles: Clean Architecture, Controller/Service Separation
"""

from flask import Flask, render_template, jsonify, request
from dataclasses import dataclass
from typing import List, Dict

app = Flask(__name__)

# Mock Fast Food Menu Database with Multi-language Support
MENU_ITEMS = [
    {
        "id": "1",
        "category": "combos",
        "emoji": "🍔🥤",
        "prep_time": 4,
        "price": 3500,
        "name": {
            "rw": "Express Burger Combo",
            "en": "Express Burger Combo",
            "fr": "Combo Burger Express"
        },
        "desc": {
            "rw": "Burger nene + Ibipfunsi by'ibirayi + Fanta ikonje",
            "en": "Juicy beef burger + Crispy fries + Cold soda",
            "fr": "Burger au bœuf + Frites croustillantes + Soda frais"
        }
    },
    {
        "id": "2",
        "category": "burgers",
        "emoji": "🌯",
        "prep_time": 3,
        "price": 2500,
        "name": {
            "rw": "Kigali Chicken Wrap",
            "en": "Kigali Chicken Wrap",
            "fr": "Wrap au Poulet Kigali"
        },
        "desc": {
            "rw": "Wrap y'inkoko yagijwe n'imboga nshya",
            "en": "Grilled chicken wrap with fresh veggies & sauce",
            "fr": "Wrap au poulet grillé avec légumes frais"
        }
    },
    {
        "id": "3",
        "category": "snacks",
        "emoji": "🍗",
        "prep_time": 5,
        "price": 2000,
        "name": {
            "rw": "Inkoko Zikaranze (3 Pcs)",
            "en": "Crispy Fried Chicken (3 Pcs)",
            "fr": "Poulet Frit Croustillant (3 Pcs)"
        },
        "desc": {
            "rw": "Ibisate 3 by'inkoko ikaranze neza",
            "en": "3 pieces of golden crispy fried chicken",
            "fr": "3 pièces de poulet frit doré"
        }
    },
    {
        "id": "4",
        "category": "drinks",
        "emoji": "🧃",
        "prep_time": 1,
        "price": 1000,
        "name": {
            "rw": "Jus Y'umwimerere (Fresh Juice)",
            "en": "Fresh Natural Juice",
            "fr": "Jus Naturel Frais"
        },
        "desc": {
            "rw": "Jus y'imbuto z'umwimerere ikonje",
            "en": "Freshly squeezed passion fruit / mango juice",
            "fr": "Jus de fruits frais pressés"
        }
    }
]

# In-memory Order Queue
ORDERS_DB = []

# ==================== CONTROLLER ROUTES ====================

@app.route('/')
def index():
    """Serves the main Responsive Single Page Web App."""
    return render_template('index.html')


@app.route('/api/menu', methods=['GET'])
def get_menu():
    """Endpoint returning all fast food items."""
    return jsonify(MENU_ITEMS), 200


@app.route('/api/orders', methods=['POST'])
def create_order():
    """Endpoint processing commuter orders."""
    data = request.get_json()

    # Input validation
    if not data or 'phone' not in data or 'cart' not in data:
        return jsonify({"error": "Invalid order payload"}), 400

    order_id = f"NJ-{len(ORDERS_DB) + 1001}"
    new_order = {
        "order_id": order_id,
        "phone": data['phone'],
        "station": data.get('station', 'nyabugogo'),
        "pickup_minutes": data.get('pickup_minutes', 5),
        "items": data['cart'],
        "total_amount": data['total_amount'],
        "status": "PREPARING"
    }

    ORDERS_DB.append(new_order)

    # Return success response
    return jsonify({
        "message": "Order placed successfully!",
        "order_id": order_id,
        "status": "PREPARING"
    }), 201


if __name__ == '__main__':
    app.run(debug=True, port=5000)
