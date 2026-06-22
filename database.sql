CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY, 
    name VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO tickets (name, email, title, category, description, priority, status)
VALUES ('Anh','dinhanh@iu.edu', 'Computer issues', 'Hardware', 'My computer needs fixing pls', 'low', 'open');

SELECT * 
FROM tickets;