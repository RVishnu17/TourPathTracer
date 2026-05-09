const map = L.map('map').setView([9.8566, 78.3522], 13);

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap contributors'
    },
    2).addTo(map);

// routing machine ---------------
const rc = L.Routing.control({
    waypoints: [],
    position: 'bottomleft',
    routeWhileDragging: true,
    createMarker: function() {
        return null;
    }
}).addTo(map);
//
// function createButton(label, container) {
//     var btn = L.DomUtil.create('button', '', container);
//     btn.setAttribute('type', 'button');
//     btn.innerHTML = label;
//     return btn;
// }
//
// map.on('click', function(e) {
//     var container = L.DomUtil.create('div'),
//         startBtn = createButton('Start from this location', container),
//         destBtn = createButton('Go to this location', container);
//
//     L.popup()
//         .setContent(container)
//         .setLatLng(e.latlng)
//         .openOn(map);
// });
//

// ------------------------------------------
//  custom marker icons
const iconBasePath = 'icons/';
const markersData = [];
let nextMarkerId = 1;
let draggedMarkerId = null;

function moveMarkerInList(draggedId, targetId) {
    if (draggedId === targetId) {
        return;
    }

    const fromIndex = markersData.findIndex((entry) => entry.id === draggedId);
    const toIndex = markersData.findIndex((entry) => entry.id === targetId);

    if (fromIndex === -1 || toIndex === -1) {
        return;
    }

    const [movedEntry] = markersData.splice(fromIndex, 1);
    markersData.splice(toIndex, 0, movedEntry);
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById("tbody");
    tbody.innerHTML = "";

    markersData.forEach((item, index) => {
        const tr = document.createElement("tr");
        tr.classList.add("clickable-row");
        tr.draggable = true;
        tr.dataset.markerId = item.id;

        const td1 = document.createElement("td");
        td1.innerText = index + 1;

        const td2 = document.createElement("td");
        td2.innerText = item.locationName;


        tr.addEventListener("click", () => {
            map.setView([item.lat, item.lng], Math.max(map.getZoom(), 15));
            item.marker.openPopup();
        });

        tr.addEventListener("dragstart", () => {
            draggedMarkerId = item.id;
            tr.style.opacity = "0.5";
        });

        tr.addEventListener("dragover", (event) => {
            event.preventDefault();
        });

        tr.addEventListener("drop", (event) => {
            event.preventDefault();
            moveMarkerInList(draggedMarkerId, item.id);
        });

        tr.addEventListener("dragend", () => {
            draggedMarkerId = null;
            tr.style.opacity = "1";
        });

        tr.appendChild(td1);
        tr.appendChild(td2);
        tbody.appendChild(tr);
    });
}

function removeMarkerById(markerId) {
    const markerIndex = markersData.findIndex((entry) => entry.id === markerId);
    if (markerIndex === -1) {
        return;
    }

    markersData[markerIndex].marker.remove();
    markersData.splice(markerIndex, 1);
    renderTable();
}

async function getLocationName(markerEntry) {
    const url =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${markerEntry.lat}&lon=${markerEntry.lng}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            markerEntry.marker.bindPopup("location unregistered removing ....").openPopup();
            removeMarkerById(markerEntry.id);
            return;
        }

        markerEntry.locationName = data.display_name;
        markerEntry.marker.bindPopup(markerEntry.locationName).openPopup();
         renderTable();


        const currwp = rc.getPlan().getWaypoints();

        currwp.push(
            L.Routing.waypoint(
                L.latLng(markerEntry.lat, markerEntry.lng)
            )
        );

        rc.setWaypoints(
            currwp.filter(wp => wp.latLng)
        );
    } catch (error) {

        console.log(error.toString());
        markerEntry.locationName = "location unregistered";
        markerEntry.marker.bindPopup(markerEntry.locationName).openPopup();
        renderTable();
    }
}

const iconConfig = {
    iconSize: [38, 95],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [50, 64],
    iconAnchor: [22, 94],
    shadowAnchor: [4, 62],
    popupAnchor: [-3, -76]
};

const greenIcon = L.icon({
    iconUrl: iconBasePath + 'leaf-green.png',
    ...iconConfig
});

const blueIcon = L.icon({
    iconUrl: iconBasePath + 'leaf-blue.png',
    ...iconConfig
});

const purpleIcon = L.icon({
    iconUrl: iconBasePath + 'leaf-purple.png',
    ...iconConfig
});

const tealIcon = L.icon({
    iconUrl: iconBasePath + 'leaf-teal.png',
    ...iconConfig
});

const yellowIcon = L.icon({
    iconUrl: iconBasePath + 'leaf-yellow.png',
    ...iconConfig
});

const pinkIcon = L.icon({
    iconUrl: iconBasePath + 'leaf-pink.png',
    ...iconConfig
});

const brownIcon = L.icon({
    iconUrl: iconBasePath + 'leaf-brown.png',
    ...iconConfig
});

const grayIcon = L.icon({
    iconUrl: iconBasePath + 'leaf-gray.png',
    ...iconConfig
});

const iconPool = [greenIcon, blueIcon, purpleIcon, tealIcon, yellowIcon, pinkIcon, brownIcon, grayIcon];
let iconIndex = 0;

function diffmarkers() {
    const selectedIcon = iconPool[iconIndex % iconPool.length];
    iconIndex += 1;
    return selectedIcon;
}

map.on("click", function (e) {
    const marker = L.marker([e.latlng.lat, e.latlng.lng], {icon: diffmarkers()})
        .addTo(map)
        .bindPopup("Loading ...")
        .openPopup();

    const markerEntry = {
        id: nextMarkerId++,
        marker,
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        locationName: "Loading ..."
    };

    marker.on("contextmenu", () => {
        removeMarkerById(markerEntry.id);
    });

    markersData.push(markerEntry);
    renderTable();
    getLocationName(markerEntry);
});
