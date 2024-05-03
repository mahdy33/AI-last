
let net;
const nationalityMapping = {};
const destinationMapping = {};
const reverseDestinationMapping = {};
let destinationCountsUnder30 = {};
let destinationCountsByNationality = {};
let travelersData = [];

function setupMappings() {
    nationalityMapping['American'] = 0;
    nationalityMapping['British'] = 1;
    destinationMapping['New York, USA'] = 0;
    destinationMapping['London, UK'] = 1;
    reverseDestinationMapping[0] = 'New York, USA';
    reverseDestinationMapping[1] = 'London, UK';
}

function processResults(data) {
    data.forEach(item => {
        const nationality = item['Traveler nationality'];
        const destination = item['Destination'];
        const age = item['Traveler age'];

        if (age < 30) {
            destinationCountsUnder30[destination] = (destinationCountsUnder30[destination] || 0) + 1;
        }

        if (!destinationCountsByNationality[nationality]) {
            destinationCountsByNationality[nationality] = {};
        }
        destinationCountsByNationality[nationality][destination] = (destinationCountsByNationality[nationality][destination] || 0) + 1;
    });
    displayPopularDestinations();
}

function displayPopularDestinations() {
    let mostCommonUnder30 = Object.keys(destinationCountsUnder30).reduce((a, b) => destinationCountsUnder30[a] > destinationCountsUnder30[b] ? a : b);
    document.getElementById('popularUnder30').innerText = 'Most popular destination for under 30: ' + mostCommonUnder30;

    for (const nationality in destinationCountsByNationality) {
        let destinations = destinationCountsByNationality[nationality];
        let mostCommon = Object.keys(destinations).reduce((a, b) => destinations[a] > destinations[b] ? a : b);
        let elementId = `popularBy${nationality.replace(/\s/g, '')}`;
        if (!document.getElementById(elementId)) {
            let p = document.createElement('p');
            p.id = elementId;
            document.body.appendChild(p);
        }
        document.getElementById(elementId).innerText = `Most popular destination for ${nationality}: ${mostCommon}`;
    }
}

function loadAndTrain() {
    const fileInput = document.getElementById('csvFile');
    if (fileInput.files.length === 0) {
        alert('Please select a file first.');
        return;
    }
    const file = fileInput.files[0];
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function (results) {
            travelersData = results.data;
            processResults(results.data);
            const encodedData = encodeData(results.data);
            net = new brain.NeuralNetwork({
                hiddenLayers: [3],
                activation: 'sigmoid'
            });
            net.train(encodedData, {
                iterations: 30000,
                log: true,
                logPeriod: 100,
                learningRate: 0.05
            });
            alert('Model trained successfully!');
        }
    });
}

function encodeData(data) {
    return data.map(item => ({
        input: {
            age: item['Traveler age'] / 100,
            nationality: nationalityMapping[item['Traveler nationality']] || 0
        },
        output: {
            destination: destinationMapping[item['Destination']] || 0
        }
    }));
}

function predictDestination() {
    const age = parseFloat(document.getElementById('ageInput').value) / 100;
    const nationality = document.getElementById('nationalityInput').value;
    const encodedNationality = nationalityMapping[nationality] || 0;
    const output = net.run({ age, nationality: encodedNationality });
    const predictedIndex = Math.round(output.destination);
    const destination = reverseDestinationMapping[predictedIndex] || "Unknown";
    document.getElementById('predictionResult').innerText = 'Predicted Destination: ' + destination;
}

function lookupTraveler() {
    const name = document.getElementById('nameInput').value.trim().toLowerCase();
    const traveler = travelersData.find(traveler => traveler['Traveler name'].toLowerCase() === name);
    if (traveler) {
        displayTravelerDetails(traveler);
    } else {
        document.getElementById('travelerDetails').innerText = "No traveler found with that name.";
    }
}

function displayTravelerDetails(traveler) {
    let detailsText = "Traveler Details:\n";
    Object.keys(traveler).forEach(key => {
        detailsText += `${key}: ${traveler[key]}\n`;
    });
    document.getElementById('travelerDetails').innerText = detailsText;
}

document.addEventListener('DOMContentLoaded', () => {
    setupMappings(); // Initialize mappings when the page is loaded
    document.getElementById('loadButton').addEventListener('click', loadAndTrain);
    document.getElementById('lookupButton').addEventListener('click', lookupTraveler);
});























