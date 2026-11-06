
// ==========================================
// ACCESSPATH - MULTIPAGE WEBSITE
// ==========================================

// Shared campus locations

const nodes = {
    gate: { x: 900, y: 465, name: "Main Gate" },
    cse:  { x: 247, y: 300, name: "CSE Block" },

    b1: { x: 435, y: 185, name: "Building 1" },
    b2: { x: 577, y: 185, name: "Building 2" },
    b3: { x: 725, y: 200, name: "Building 3" },
    b4: { x: 177, y: 390, name: "Building 4" },
    b5: { x: 372, y: 410, name: "Building 5" },
    b6: { x: 575, y: 430, name: "Building 6" },
    b7: { x: 782, y: 440, name: "Building 7" },

    // Pathway junctions

    j1: { x: 800, y: 420 },
    j2: { x: 700, y: 385 },
    j3: { x: 580, y: 365 },
    j4: { x: 430, y: 365 },
    j5: { x: 260, y: 365 },
    w1: { x: 550, y: 270 },
    w2: { x: 700, y: 285 }
};


// ==========================================
// CAMPUS PATH CONNECTIONS
// ==========================================

const edges = [];

function addEdge(from, to, distance, accessible = true) {
    edges.push({ from, to, distance, accessible });
}

// Main road

addEdge("gate", "j1", 120);
addEdge("j1", "j2", 100);
addEdge("j2", "j3", 120);
addEdge("j3", "j4", 150);
addEdge("j4", "j5", 150);

// Building connections

addEdge("j5", "cse", 85);
addEdge("j5", "b4", 95);
addEdge("j4", "b5", 95);
addEdge("j3", "b6", 90);
addEdge("j1", "b7", 75);

// Upper pathways

addEdge("j3", "w1", 100);
addEdge("w1", "b1", 140);
addEdge("w1", "b2", 110);

addEdge("j2", "w2", 100);
addEdge("w2", "b3", 100);

// Sample shortcut not included in accessible routing

addEdge("j3", "b2", 80, false);


// ==========================================
// DIJKSTRA ALGORITHM
// ==========================================

function findRoute(start, destination, preference) {

    const distances = {};
    const previous = {};
    const visited = new Set();

    Object.keys(nodes).forEach(node => {
        distances[node] = Infinity;
        previous[node] = null;
    });

    distances[start] = 0;

    while (visited.size < Object.keys(nodes).length) {

        let current = null;
        let shortestDistance = Infinity;

        for (const node of Object.keys(nodes)) {

            if (
                !visited.has(node) &&
                distances[node] < shortestDistance
            ) {
                shortestDistance = distances[node];
                current = node;
            }
        }

        if (current === null) break;

        if (current === destination) break;

        visited.add(current);

        for (const edge of edges) {

            let neighbour = null;

            if (edge.from === current) {
                neighbour = edge.to;
            } else if (edge.to === current) {
                neighbour = edge.from;
            }

            if (neighbour === null) continue;

            if (
                (preference === "wheelchair" ||
                 preference === "noStairs") &&
                !edge.accessible
            ) {
                continue;
            }

            if (visited.has(neighbour)) continue;

            const newDistance =
                distances[current] + edge.distance;

            if (newDistance < distances[neighbour]) {

                distances[neighbour] = newDistance;
                previous[neighbour] = current;

            }
        }
    }

    if (distances[destination] === Infinity) {
        return null;
    }

    const path = [];
    let current = destination;

    while (current !== null) {
        path.unshift(current);
        current = previous[current];
    }

    return {
        path,
        distance: distances[destination]
    };
}


// ==========================================
// ROUTE PLANNER PAGE
// ==========================================

const routeForm = document.getElementById("routeForm");

if (routeForm) {

    routeForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const start = document.getElementById("start").value;

        const destination =
            document.getElementById("destination").value;

        const preference =
            document.getElementById("preference").value;

        const message =
            document.getElementById("plannerMessage");

        if (start === destination) {

            message.hidden = false;
            message.className = "message error";
            message.textContent =
                "Please select two different locations.";

            return;
        }

        const result = findRoute(
            start,
            destination,
            preference
        );

        if (!result) {

            message.hidden = false;
            message.className = "message error";
            message.textContent = "No route was found.";

            return;
        }

        // Open map page in the SAME browser tab

        const params = new URLSearchParams({
            start: start,
            destination: destination,
            preference: preference
        });

        window.location.href = "map.html?" + params.toString();

    });

}


// ==========================================
// CAMPUS MAP PAGE
// ==========================================

const campusMap = document.getElementById("campusMap");

if (campusMap) {

    const params = new URLSearchParams(window.location.search);

    const start = params.get("start");
    const destination = params.get("destination");
    const preference = params.get("preference") || "shortest";

    const routeLine = document.getElementById("routeLine");
    const mapResult = document.getElementById("mapResult");

    // Draw the route if the user came from planner

    if (
        start &&
        destination &&
        nodes[start] &&
        nodes[destination]
    ) {

        const result = findRoute(start, destination, preference);

        if (result) {

            const points = result.path.map(node => {
                return `${nodes[node].x},${nodes[node].y}`;
            }).join(" ");

            routeLine.setAttribute("points", points);

            const routeNames = result.path
                .filter(node => nodes[node].name)
                .map(node => nodes[node].name);

            const minutes = Math.max(
                1,
                Math.ceil(result.distance / 75)
            );

            mapResult.hidden = false;
            mapResult.innerHTML = `
                <strong>Route Found!</strong><br><br>
                <b>From:</b> ${nodes[start].name}<br>
                <b>To:</b> ${nodes[destination].name}<br>
                <b>Distance:</b> ${result.distance} metres (sample estimate)<br>
                <b>Estimated Time:</b> ${minutes} minutes<br>
                <b>Route:</b> ${routeNames.join(" → ")}
            `;

        } else {

            mapResult.hidden = false;
            mapResult.textContent = "No route found.";

        }

    }

}


// ==========================================
// REPORT ISSUE PAGE
// ==========================================

const reportForm = document.getElementById("reportForm");

if (reportForm) {

    const reportMessage =
        document.getElementById("reportMessage");

    reportForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const location =
            document.getElementById("issueLocation").value;

        const issue =
            document.getElementById("issueType").value;

        const description =
            document.getElementById("issueDescription").value;

        if (!location || !issue || !description.trim()) {
            return;
        }

        // Count reports in this browser session

        let totalIssues = Number(
            sessionStorage.getItem("accessPathIssues") || 0
        );

        totalIssues++;

        sessionStorage.setItem(
            "accessPathIssues",
            totalIssues
        );

        reportMessage.hidden = false;
        reportMessage.className = "message";

        reportMessage.textContent =
            "Your demo report has been submitted successfully! " +
            "Total reports in this session: " + totalIssues;

        reportForm.reset();

    });

}


// ==========================================
// DASHBOARD ISSUE COUNTER
// ==========================================

const issueCount = document.getElementById("issueCount");

if (issueCount) {

    issueCount.textContent =
        sessionStorage.getItem("accessPathIssues") || 0;

}

console.log("AccessPath Multipage Website Loaded!");
