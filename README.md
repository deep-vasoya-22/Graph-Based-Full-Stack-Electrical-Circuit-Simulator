# ⚡ Graph-Based Full-Stack Electrical Circuit Simulator

> A graph-based electrical circuit simulator that models electrical networks using **Data Structures & Algorithms (Graphs)**. The project integrates a **C++ simulation engine**, **Node.js backend**, and **JavaScript frontend** to provide an interactive environment for circuit creation, connectivity analysis, and real-time visualization.

---

## 📌 Overview

Traditional circuit simulators often hide the underlying computational logic. This project focuses on representing electrical circuits as **graph data structures**, where electrical components act as vertices and electrical connections act as edges.

The simulator enables efficient circuit modeling, graph traversal, connectivity analysis, and interactive visualization while demonstrating the practical application of graph algorithms in electrical engineering.

---

## ✨ Features

- 🔹 Graph-based circuit representation
- 🔹 Interactive circuit visualization
- 🔹 Real-time component connectivity analysis
- 🔹 C++ simulation engine for efficient processing
- 🔹 Node.js backend for computation and API handling
- 🔹 JavaScript frontend for user interaction
- 🔹 Modular and scalable architecture
- 🔹 Efficient graph traversal using Data Structures & Algorithms
- 🔹 Backend-Frontend communication through REST APIs

---

## 🛠️ Technology Stack

| Category | Technologies |
|-----------|--------------|
| Programming Language | C++ |
| Backend | Node.js, Express.js |
| Frontend | HTML, CSS, JavaScript |
| Data Structure | Graph (Adjacency List) |
| Algorithms | BFS, DFS, Graph Traversal |
| Version Control | Git & GitHub |

---

## 🏗️ System Architecture

```
            User Interface
                  │
                  ▼
      JavaScript Frontend
                  │
          REST API Requests
                  │
                  ▼
         Node.js Backend
                  │
      Executes Simulation Logic
                  │
                  ▼
         C++ Simulation Engine
                  │
      Graph Representation of Circuit
                  │
                  ▼
      Connectivity & Analysis Results
```

---

## ⚙️ Working Principle

1. The user creates an electrical circuit through the frontend.
2. Components and connections are converted into a graph structure.
3. The backend sends the graph data to the C++ simulation engine.
4. Graph algorithms analyze circuit connectivity and relationships.
5. Results are returned to the frontend for visualization.

---

## 📂 Project Structure

```
Graph-Based-Full-Stack-Electrical-Circuit-Simulator
│
├── Backend/
│   ├── server.js
│   ├── routes/
│   └── controllers/
│
├── Frontend/
│   ├── HTML
│   ├── CSS
│   └── JavaScript
│
├── CppEngine/
│   ├── Graph.cpp
│   ├── Graph.h
│   ├── Simulation.cpp
│   └── Algorithms.cpp
│
├── Images/
│
├── README.md
│
└── package.json
```

---

## 📷 Screenshots

### Home Interface

> Add screenshot here

```
images/home.png
```

---

### Circuit Visualization

> Add screenshot here

```
images/circuit.png
```

---

### Graph Representation

> Add screenshot here

```
images/graph.png
```

---

## 🚀 Installation

### Clone Repository

```bash
git clone https://github.com/deep-vasoya-22/Graph-Based-Full-Stack-Electrical-Circuit-Simulator.git
```

Move into the project directory

```bash
cd Graph-Based-Full-Stack-Electrical-Circuit-Simulator
```

---

### Install Backend Dependencies

```bash
npm install
```

---

### Compile the C++ Engine

```bash
g++ Simulation.cpp Graph.cpp Algorithms.cpp -o simulator
```

---

### Start Backend

```bash
npm start
```

---

### Open Frontend

Open

```
index.html
```

or

```
http://localhost:3000
```

---

## 📖 Learning Outcomes

This project strengthened practical understanding of:

- Graph Data Structures
- Graph Traversal Algorithms
- Software Engineering Principles
- Backend API Development
- Full-Stack Development
- C++ Programming
- System Design
- Modular Software Architecture
- Frontend–Backend Integration

---

## 🔮 Future Enhancements

- SPICE-compatible simulation
- AC/DC circuit analysis
- Shortest path based current flow analysis
- Real-time voltage and current calculation
- Component library expansion
- Drag-and-drop circuit builder
- Save and load circuit projects
- Cloud deployment

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

## 👨‍💻 Author

**Deep Vasoya**

B.Tech Electrical Engineering (Minor in Computer Science)

Nirma University

GitHub: https://github.com/deep-vasoya-22

LinkedIn: *(Add your LinkedIn URL here)*

---

## ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.
