const canvas = document.getElementById('circuitCanvas');
const ctx = canvas.getContext('2d');
let currentTool = null;
let isWiring = false;
let wiringStartComponent = null;
let components = [];
let wires = [];
let nextComponentId = 1;
let animationFrameId;
let chargeParticles = [];
let isPathfinding = false;
let pathStartNode = null;
let selectedComponent = null;
let currentWirePath = []; 
class Node {
    constructor(component, terminalIndex) {
        this.component = component;
        this.terminalIndex = terminalIndex;
        this.x = 0;
        this.y = 0;
        this.voltage = null;
        this.updatePosition();
    }
    updatePosition() {
        if (this.component.orientation === 'horizontal') {
            this.x = this.component.x + (this.terminalIndex === 0 ? -this.component.width / 2 : this.component.width / 2);
            this.y = this.component.y;
        } else { 
            this.x = this.component.x;
            this.y = this.component.y + (this.terminalIndex === 0 ? -this.component.width / 2 : this.component.width / 2);
        }
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'blue';
        ctx.fill();
    }
}

class Component {
    constructor(x, y) {
        this.id = nextComponentId++;
        this.x = x;
        this.y = y;
        this.width = 60;
        this.orientation = 'horizontal';
        this.nodes = [new Node(this, 0), new Node(this, 1)];
        this.current = null;
    }

    rotate() {
        this.orientation = (this.orientation === 'horizontal') ? 'vertical' : 'horizontal';
        this.nodes.forEach(n => n.updatePosition());
    }
}


class Resistor extends Component {
    constructor(x, y) {
        super(x, y);
        this.type = 'Resistor';
        this.name = `R${this.id}`;
        this.value = 1000;
    }
    draw() {
        const height = 20;
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;

        if (this.orientation === 'horizontal') {
            ctx.strokeRect(this.x - this.width / 2, this.y - height / 2, this.width, height);
        } else {
            ctx.strokeRect(this.x - height / 2, this.y - this.width / 2, height, this.width);
        }

        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.name, this.x, this.y);
        this.nodes.forEach(n => n.draw());
    }

}

class VoltageSource extends Component {
    constructor(x, y) {
        super(x, y);
        this.type = 'VoltageSource';
        this.name = `V${this.id}`;
        this.value = 10;
        this.width = 50;
        this.nodes.forEach(n => n.updatePosition());
    }
    draw() {
        const radius = this.width / 2;
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.font = "20px Arial";
        if (this.orientation === 'horizontal') {
            ctx.fillText("+", this.x - radius / 2, this.y);
            ctx.fillText("-", this.x + radius / 2, this.y);
        } else {
            ctx.fillText("+", this.x, this.y - radius / 2);
            ctx.fillText("-", this.x, this.y + radius / 2);
        }

        ctx.font = "16px Arial";
        ctx.fillText(this.name, this.x, this.y - radius - 10);
        this.nodes.forEach(n => n.draw());
    }
}
const toolButtons = {
    select: document.getElementById('selectBtn'),
    resistor: document.getElementById('resistorBtn'),
    voltage_source: document.getElementById('voltageSourceBtn'),
    wire: document.getElementById('wireBtn'),
    path: document.getElementById('pathBtn'),
    rotate: document.getElementById('rotateBtn'),
};

function setActiveTool(toolName) {
    currentTool = toolName;
    Object.values(toolButtons).forEach(button => button.classList.remove('selected'));
    
    if (toolName && toolButtons[toolName]) {
        toolButtons[toolName].classList.add('selected');
    } else {
         toolButtons.select.classList.add('selected');
    }
    
    isPathfinding = (toolName === 'path');
    pathStartNode = null;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    redrawCanvas();
}

toolButtons.select.addEventListener('click', () => setActiveTool(null));
toolButtons.resistor.addEventListener('click', () => setActiveTool('resistor'));
toolButtons.voltage_source.addEventListener('click', () => setActiveTool('voltage_source'));
toolButtons.wire.addEventListener('click', () => setActiveTool('wire'));
toolButtons.path.addEventListener('click', () => setActiveTool('path'));
toolButtons.rotate.addEventListener('click', () => setActiveTool('rotate'));

document.getElementById('editor-value').addEventListener('input', updateComponentValue);
document.getElementById('editor-close').addEventListener('click', hideEditorPanel);
canvas.addEventListener('mousemove', onCanvasMouseMove);
canvas.addEventListener('mousedown', onCanvasMouseDown);
document.getElementById('simulateBtn').addEventListener('click', generateNetlistAndSimulate);


function onCanvasMouseDown(event) {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        chargeParticles = [];
    }
    const { x, y } = getMousePos(event);
    const clickedNode = findNodeAt(x, y);

    if (currentTool === 'rotate') {
        const clickedComp = findComponentAt(x, y);
        if (clickedComp) clickedComp.rotate();
    } else if (currentTool === 'wire') {
        if (!isWiring && clickedNode) {
            isWiring = true;
            wiringStartComponent = clickedNode;
            currentWirePath = [{ x: clickedNode.x, y: clickedNode.y }];
        } else if (isWiring) {
            if (currentWirePath.length === 0) {
                isWiring = false;
                return;
            }
            const lastPoint = currentWirePath[currentWirePath.length - 1];
            if (clickedNode && clickedNode !== wiringStartComponent) {
                currentWirePath.push({ x: clickedNode.x, y: lastPoint.y });
                currentWirePath.push({ x: clickedNode.x, y: clickedNode.y });
                wires.push({ start: wiringStartComponent, end: clickedNode, path: currentWirePath });
                isWiring = false;
                currentWirePath = [];
            } else {
                currentWirePath.push({ x: x, y: lastPoint.y });
                currentWirePath.push({ x: x, y: y });
            }
        }
    } else if (currentTool === 'path') {
        if (!clickedNode) return;
        if (!pathStartNode) {
            pathStartNode = clickedNode;
        } else {
            const endNode = clickedNode;
            if (pathStartNode !== endNode) {
                const startId = getNodeLogicalId(pathStartNode);
                const endId = getNodeLogicalId(endNode);
                if (startId !== undefined && endId !== undefined) {
                    findPathOnServer(startId, endId);
                } else {
                    alert("Could not determine logical IDs for pathfinding. Ensure the circuit is fully connected.");
                }
            }
            pathStartNode = null; 
        }
    } else if (currentTool === 'resistor') {
        components.push(new Resistor(x, y));
    } else if (currentTool === 'voltage_source') {
        components.push(new VoltageSource(x, y));
    } else {
        selectedComponent = findComponentAt(x, y);
        if (selectedComponent) {
            showEditorPanel(selectedComponent);
        } else {
            hideEditorPanel();
        }
    }

    redrawCanvas();
}

function onCanvasMouseMove(event) {
    if (isWiring && currentWirePath.length > 0) {
        redrawCanvas();
        const { x, y } = getMousePos(event);
        const lastPoint = currentWirePath[currentWirePath.length - 1];

        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, lastPoint.y); 
        ctx.lineTo(x, y);          
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    wires.forEach(wire => {
        if (!wire.path || wire.path.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(wire.path[0].x, wire.path[0].y);
        for (let i = 1; i < wire.path.length; i++) {
            ctx.lineTo(wire.path[i].x, wire.path[i].y);
        }
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    components.forEach(comp => comp.draw());

    if (isPathfinding && pathStartNode) {
        highlightNode(pathStartNode, 'orange');
    }
}


function getMousePos(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function findNodeAt(x, y) {
    for (const comp of components) {
        for (const node of comp.nodes) {
            const dist = Math.sqrt((x - node.x)**2 + (y - node.y)**2);
            if (dist < 8) return node;
        }
    }
    return null;
}

function findComponentAt(x, y) {
    for (let i = components.length - 1; i >= 0; i--) {
        const comp = components[i];
        const halfWidth = comp.width / 2;
        const halfHeight = comp.orientation === 'horizontal' ? 30 : comp.width / 2;
        const width = comp.orientation === 'horizontal' ? comp.width : 60;
        
        if (x > comp.x - width/2 && x < comp.x + width/2 &&
            y > comp.y - halfHeight && y < comp.y + halfHeight) {
            return comp;
        }
    }
    return null;
}


function showEditorPanel(comp) {
    const panel = document.getElementById('editor-panel');
    panel.classList.remove('hidden');
    document.getElementById('editor-title').innerText = `Edit ${comp.name}`;
    document.getElementById('editor-value').value = comp.value;
}

function hideEditorPanel() {
    const panel = document.getElementById('editor-panel');
    panel.classList.add('hidden');
    selectedComponent = null;
    redrawCanvas();
}

function updateComponentValue() {
    if (selectedComponent) {
        const newValue = parseFloat(document.getElementById('editor-value').value);
        if (!isNaN(newValue)) {
            selectedComponent.value = newValue;
        }
    }
}


async function generateNetlistAndSimulate() {
    const netlist = generateNetlistString();
    if (!netlist) return;

    try {
        const response = await fetch('/simulate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ netlist }),
        });
        if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
        const data = await response.json();
        parseAndApplyResults(data.results, getNodeLogicalIdMap());
        setupAnimation();
        animate();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to run simulation.');
    }
}

async function findPathOnServer(startId, endId) {
    const netlist = generateNetlistString();
    if (!netlist) return;

    try {
        const response = await fetch('/find-path', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ netlist, startNode: startId, endNode: endId }),
        });
        if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
        const data = await response.json();
        animateDijkstra(data.results);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to run path analysis.');
    }
}

function getNodeLogicalIdMap() {
    const nodeToLogicalId = new Map();
    let logicalNodeCounter = 0;
    const visited = new Set();
    let groundSet = null;

    for (const comp of components) {
        if (comp.type === 'VoltageSource') {
            const negTerminal = comp.nodes[1];
            groundSet = findConnectedGroup(negTerminal);
            break;
        }
    }
    if (groundSet) {
        groundSet.forEach(n => {
            visited.add(n);
            nodeToLogicalId.set(n, 0); 
        });
        logicalNodeCounter = 1;
    }

    for (const comp of components) {
        for (const node of comp.nodes) {
            if (!visited.has(node)) {
                const group = findConnectedGroup(node);
                const currentLogicalId = logicalNodeCounter++;
                group.forEach(n => {
                    visited.add(n);
                    nodeToLogicalId.set(n, currentLogicalId);
                });
            }
        }
    }
    return nodeToLogicalId;
}

function generateNetlistString() {
    if (components.length === 0) {
        alert("Circuit is empty!");
        return "";
    }
    const nodeToLogicalId = getNodeLogicalIdMap();
    let netlist = "";
    for (const comp of components) {
        const n1Id = nodeToLogicalId.get(comp.nodes[0]);
        const n2Id = nodeToLogicalId.get(comp.nodes[1]);
        if (n1Id === undefined || n2Id === undefined) {
             alert("Error: Not all components are fully wired. Please check your circuit.");
             return "";
        }
        netlist += `${comp.name} ${n1Id} ${n2Id} ${comp.value}\n`;
    }
    return netlist;
}

function findConnectedGroup(startNode) {
    const group = new Set([startNode]);
    const queue = [startNode];
    const visitedInGroup = new Set([startNode]);
    while (queue.length > 0) {
        const currentNode = queue.shift();
        for (const wire of wires) {
            let neighbor = null;
            if (wire.start === currentNode) neighbor = wire.end;
            if (wire.end === currentNode) neighbor = wire.start;
            if (neighbor && !visitedInGroup.has(neighbor)) {
                visitedInGroup.add(neighbor);
                group.add(neighbor);
                queue.push(neighbor);
            }
        }
    }
    return group;
}

function getNodeLogicalId(physicalNode) {
    const map = getNodeLogicalIdMap();
    return map.get(physicalNode);
}

function getNodesByLogicalId(logicalId, nodeMap) {
    const nodes = [];
    for (const [node, id] of nodeMap.entries()) {
        if (id === logicalId) {
            nodes.push(node);
        }
    }
    return nodes;
}


// --- Parsing and Animation ---
function parseAndApplyResults(resultString, nodeToLogicalId) {
    nodeToLogicalId.forEach((id, node) => {
        if (id === 0) node.voltage = 0.0;
    });

    const voltRegex = /- Node (\d+): ([\-\d\.]+) V/g;
    let match;
    while ((match = voltRegex.exec(resultString)) !== null) {
        const logicalId = parseInt(match[1]);
        const voltage = parseFloat(match[2]);
        nodeToLogicalId.forEach((id, node) => {
            if (id === logicalId) node.voltage = voltage;
        });
    }

    components.forEach(comp => {
        if (comp.type === 'Resistor') {
            const v1 = comp.nodes[0].voltage;
            const v2 = comp.nodes[1].voltage;
            if (v1 !== null && v2 !== null) comp.current = (v1 - v2) / comp.value;
        }
    });

    const currentRegex = /Current through (V\d+): ([\-\d\.]+) A/g;
    while ((match = currentRegex.exec(resultString)) !== null) {
        const compName = match[1];
        const current = parseFloat(match[2]);
        const vs_comp = components.find(c => c.name === compName);
        if (vs_comp) vs_comp.current = -current;
    }
}

function animateDijkstra(resultString) {
    const visitOrderMatch = resultString.match(/VISIT_ORDER: ([\d\s]+)/);
    const finalPathMatch = resultString.match(/FINAL_PATH: ([\d\s]+)/);

    if (!visitOrderMatch || !finalPathMatch) {
        return alert("Pathfinding failed or no path exists. C++ output:\n" + resultString);
    }

    const visitOrder = visitOrderMatch[1].trim().split(' ').map(Number);
    const finalPath = finalPathMatch[1].trim().split(' ').map(Number);
    const nodeMap = getNodeLogicalIdMap();

    const visitedNodes = [];
    let step = 0;
    
    const animateStep = () => {
        redrawCanvas();
        visitedNodes.forEach(node => highlightNode(node, 'yellow'));
        
        if (step >= visitOrder.length) {
            highlightPath(finalPath, nodeMap, 'red');
            return;
        }
        
        const logicalNodeId = visitOrder[step];
        const nodesToHighlight = getNodesByLogicalId(logicalNodeId, nodeMap);
        
        nodesToHighlight.forEach(node => {
            highlightNode(node, 'yellow');
            if (!visitedNodes.includes(node)) {
                visitedNodes.push(node);
            }
        });
        
        step++;
        setTimeout(animateStep, 150);
    };
    
    redrawCanvas();
    animateStep();
}

function highlightNode(node, color) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1.0;
}

function highlightPath(logicalNodeIds, nodeMap, color) {
    ctx.lineWidth = 5;
    ctx.strokeStyle = color;

    for (let i = 0; i < logicalNodeIds.length - 1; i++) {
        const startId = logicalNodeIds[i];
        const endId = logicalNodeIds[i + 1];

        const connectingComp = components.find(c => {
            const n1Id = nodeMap.get(c.nodes[0]);
            const n2Id = nodeMap.get(c.nodes[1]);
            return (n1Id === startId && n2Id === endId) || (n1Id === endId && n2Id === startId);
        });

        if (connectingComp) {
            ctx.beginPath();
            ctx.moveTo(connectingComp.nodes[0].x, connectingComp.nodes[0].y);
            ctx.lineTo(connectingComp.nodes[1].x, connectingComp.nodes[1].y);
            ctx.stroke();
        }
    }
}

function setupAnimation() {
    chargeParticles = [];
    components.forEach(comp => {
        if (comp.current !== null && Math.abs(comp.current) > 1e-6) {
            for (let i = 0; i < 5; i++) {
                chargeParticles.push({ component: comp, progress: Math.random() });
            }
        }
    });
}

function formatCurrent(current) {
    const absCurrent = Math.abs(current);
    if (absCurrent < 1e-7) {
        return "0 A";
    }
    if (absCurrent >= 1.0) {
        return `${current.toFixed(2)} A`;
    }
    if (absCurrent >= 0.001) {
        return `${(current * 1000).toFixed(2)} mA`;
    }
    return `${(current * 1000000).toFixed(2)} µA`;
}


function animate() {
    // 1. Redraw the base circuit
    redrawCanvas();
    
    // 2. Animate current magnitude with thick lines
    let maxCurrent = 0;
    components.forEach(comp => {
        if (comp.current && Math.abs(comp.current) > maxCurrent) {
            maxCurrent = Math.abs(comp.current);
        }
    });

    const minWidth = 2;
    const maxWidth = 8;

    if (maxCurrent > 1e-9) { 
        components.forEach(comp => {
            if (comp.current && Math.abs(comp.current) > 1e-6) {
                const width = minWidth + (maxWidth - minWidth) * (Math.abs(comp.current) / maxCurrent);
                
                ctx.beginPath();
                ctx.moveTo(comp.nodes[0].x, comp.nodes[0].y);
                ctx.lineTo(comp.nodes[1].x, comp.nodes[1].y);
                ctx.strokeStyle = 'orange';
                ctx.lineWidth = width;
                ctx.globalAlpha = 0.6; 
                ctx.stroke();
                ctx.globalAlpha = 1.0; 
            }
        });
    }

    // 3. Draw Node Voltages
    const nodeMap = getNodeLogicalIdMap();
    const drawnNodes = new Set();
    components.forEach(comp => {
        comp.nodes.forEach(node => {
            const logicalId = nodeMap.get(node);
            if (node.voltage !== null && !drawnNodes.has(logicalId)) {
                const text = `${node.voltage.toFixed(2)}V`;
                ctx.font = "14px Arial";
                ctx.textBaseline = "middle"; 
                
                ctx.textAlign = "right";
                const textMetrics = ctx.measureText(text);
                const textWidth = textMetrics.width;
                const textHeight = 14;
                const padding = 2;

                const textX = node.x - 10;
                const textY = node.y;

                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fillRect(textX - textWidth - padding, textY - textHeight / 2 - padding, textWidth + (padding * 2), textHeight + (padding * 2));

                ctx.fillStyle = "purple";
                ctx.fillText(text, textX, textY);

                drawnNodes.add(logicalId);
            }
        });
    });

    // 4. Draw Component Currents
    components.forEach(comp => {
        if (comp.type === 'Resistor' && comp.current !== null) {
            const currentText = formatCurrent(Math.abs(comp.current));
            ctx.font = "14px Arial";
            ctx.fillStyle = "red";
            
            let textX, textY;
            
            if (comp.orientation === 'vertical') {
                textX = comp.x + 20;
                textY = comp.y;
                ctx.textAlign = "left";
            } else {
                textX = comp.x;
                textY = comp.y - 25;
                ctx.textAlign = "center";
            }
            
            ctx.fillText(currentText, textX, textY);
        }
    });

    // 5. Animate Charge Particles for Direction
    chargeParticles.forEach(p => {
        const comp = p.component;
        const speed = Math.sign(comp.current) * 0.01;
        p.progress = (p.progress + speed + 1) % 1.0;
        p.x = comp.nodes[0].x + (comp.nodes[1].x - comp.nodes[0].x) * p.progress;
        p.y = comp.nodes[0].y + (comp.nodes[1].y - comp.nodes[0].y) * p.progress;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = 'orange';
        ctx.fill();
    });

    // 6. Continue the animation loop
    animationFrameId = requestAnimationFrame(animate);
}

// Set the default tool to 'select' on page load
window.onload = () => {
    setActiveTool(null);
};

