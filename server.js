const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;
app.use(express.static(__dirname));
app.use(express.json());
app.post('/simulate', (req, res) => {
    const netlist = req.body.netlist;
    const netlistPath = path.join(__dirname, 'temp_netlist.txt');
    const executablePath = path.join(__dirname, 'build', 'App.exe');
    fs.writeFile(netlistPath, netlist, (err) => {
        if (err) {
            console.error("Error writing netlist file:", err);
            return res.status(500).send('Error writing netlist file.');
        }
        exec(`"${executablePath}" "${netlistPath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`C++ Execution Error: ${error.message}`);
                console.error(`stderr: ${stderr}`);
                return res.status(500).send(`Execution Error: ${stderr}`);
            }
            res.send({ results: stdout });
        });
    });
});

app.post('/find-path', (req, res) => {
    const { netlist, startNode, endNode } = req.body;
    const netlistPath = path.join(__dirname, 'temp_netlist.txt');
    const executablePath = path.join(__dirname, 'build', 'App.exe');

    fs.writeFile(netlistPath, netlist, (err) => {
        if (err) {
            console.error("Error writing netlist file:", err);
            return res.status(500).send('Error writing netlist file.');
        }
        const command = `"${executablePath}" "${netlistPath}" --path ${startNode} ${endNode}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`C++ Execution Error (Pathfinding): ${error.message}`);
                console.error(`stderr: ${stderr}`);
                return res.status(500).send(`Execution Error: ${stderr}`);
            }
            res.send({ results: stdout });
        });
    });
});
app.listen(port, () => {
    console.log(`Server is running!`);
    console.log(`Open your browser and go to http://localhost:${port}`);
});