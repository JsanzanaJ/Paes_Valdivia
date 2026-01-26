// =========================
// COLORES
// =========================
function colorPorValor(valor) {
    return valor > 650 ? "#1a9850" :
           valor > 550 ? "#66bd63" :
           valor > 450 ? "#fee08b" :
                         "#d73027";
}

const RANGOS = [
    { min: 650, label: "≥ 650", color: "#1a9850" },
    { min: 550, label: "550 – 649", color: "#66bd63" },
    { min: 450, label: "450 – 549", color: "#fee08b" },
    { min: 0,   label: "< 450", color: "#d73027" }
];

document.addEventListener("DOMContentLoaded", () => {

    const map = L.map("map").setView([-39.825, -73.245], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    let capaGeojson;
    let geojsonData;
    let pruebaActual = "Lenguaje";

    // =========================
    // LEYENDA COMO CONTROL
    // =========================
    const leyenda = L.control({ position: "bottomright" });

    leyenda.onAdd = function () {
        this._div = L.DomUtil.create("div", "leyenda leaflet-control");
        this.actualizar();
        return this._div;
    };

    leyenda.actualizar = function () {
        this._div.innerHTML = `
            <b>${pruebaActual}</b><br>
            ${RANGOS.map(r => `
                <i style="background:${r.color}"></i> ${r.label}<br>
            `).join("")}
        `;
    };

    leyenda.addTo(map);

    // =========================
    // CARGA GEOJSON
    // =========================
    fetch("data/processed/colegios_paes_valdivia.geojson")
        .then(r => r.json())
        .then(data => {
            geojsonData = data;
            dibujarCapa();
        });

    function dibujarCapa() {
        if (capaGeojson) {
            map.removeLayer(capaGeojson);
        }

        capaGeojson = L.geoJSON(geojsonData, {
            pointToLayer: (feature, latlng) => {
                const valor = feature.properties[pruebaActual];

                return L.circleMarker(latlng, {
                    radius: 8,
                    fillColor: colorPorValor(valor),
                    color: "#333",
                    weight: 1,
                    fillOpacity: 0.85
                });
            },
            onEachFeature: (feature, layer) => {

                const nombre = feature.properties.establecimiento;
                const valor = feature.properties[pruebaActual];

                // Tooltip (hover)
                layer.bindTooltip(
                 `<b>${nombre}</b><br>${pruebaActual}: ${valor}`,
                {
                    direction: "top",
                    sticky: true,
                    opacity: 0.9
                }
        );

                //pop up click
                layer.bindPopup(`
                    <b>${feature.properties.establecimiento}</b><br>
                    Lenguaje: ${feature.properties.Lenguaje}<br>
                    M1: ${feature.properties.M1}<br>
                    M2: ${feature.properties.M2}<br>
                    Historia: ${feature.properties.Historia}<br>
                    Ciencias: ${feature.properties.Ciencias}<br>
                    Obligatoria: ${feature.properties.Obligatoria}
                `);
            }
        }).addTo(map);
    }

    // =========================
    // SELECTOR
    // =========================
    document
        .getElementById("selector-prueba")
        .addEventListener("change", (e) => {
            pruebaActual = e.target.value;
            dibujarCapa();
            leyenda.actualizar();
        });
});
