import sqlite3

# Connect to database (creates it if it doesn't exist)
conn = sqlite3.connect("sales.db")
cursor = conn.cursor()

# Create a table
cursor.execute("""
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY,
    product_name TEXT,
    quantity INTEGER,
    price REAL,
    date_sold TEXT
)
""")

# Add some dummy data
data = [
    ("Laptop", 5, 1200.50, "2024-01-15"),
    ("Mouse", 10, 25.00, "2024-01-16"),
    ("Keyboard", 8, 45.00, "2024-01-17"),
    ("Monitor", 3, 300.00, "2024-01-18"),
    ("Laptop", 2, 1200.50, "2024-01-19"),
    ("Headphones", 15, 80.00, "2024-01-20")
]

cursor.executemany("INSERT INTO sales (product_name, quantity, price, date_sold) VALUES (?, ?, ?, ?)", data)
conn.commit()
conn.close()

print("Database created successfully! You will see sales.db in your folder now.")