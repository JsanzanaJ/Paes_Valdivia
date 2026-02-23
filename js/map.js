// ================================
// FUNCIÓN DE COLOR SEGÚN PUNTAJE
// ================================
function colorPorPuntaje(valor) {
    return valor > 650 ? "#1a9850" :
           valor > 550 ? "#66bd63" :
           valor > 450 ? "#fee08b" :
                         "#d73027";
}

function tamañoPorZoom(zoom) {
    if (zoom <= 12) return 10;
    if (zoom === 13) return 14;
    if (zoom === 14) return 18;
    if (zoom === 15) return 22;
    return 26;
}

// ================================
// VARIABLE DE PRUEBA ACTIVA
// ================================
let pruebaActiva = "Lenguaje";
let capaColegios = null;

// ================================
// INICIAR MAPA
// ================================
document.addEventListener("DOMContentLoaded", () => {

    const map = L.map("map").setView([-39.825, -73.245], 13);

    // ================================
    // CAPAS BASE
    // ================================
    const positron = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        { attribution: "&copy; CARTO" }
    );

    const dark = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { attribution: "&copy; CARTO" }
    );

    const satelital = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
            attribution: "Tiles &copy; Esri",
            opacity: 0.9
        }
    ).addTo(map);

    L.control.layers(
        { "Satelital": satelital, "Claro": positron, "Oscuro": dark },
        null,
        { position: "topright" }
    ).addTo(map);

    // ================================
    // LEYENDA
    // ================================
    const legend = L.control({ position: "bottomright" });

    legend.onAdd = function () {
        const div = L.DomUtil.create("div", "info legend");
        div.innerHTML = `
            <strong>${pruebaActiva}</strong><br>
            <i style="background:#1a9850"></i> > 650<br>
            <i style="background:#66bd63"></i> 550 – 650<br>
            <i style="background:#fee08b"></i> 450 – 550<br>
            <i style="background:#d73027"></i> < 450
        `;
        return div;
    };

    legend.addTo(map);

    // ================================
    // CARGAR GEOJSON
    // ================================
    fetch("data/processed/colegios_paes_valdivia.geojson")
        .then(r => r.json())
        .then(data => {

            function dibujarMapa() {

                if (capaColegios) {
                    map.removeLayer(capaColegios);
                }

                // ================================
                // CLUSTER GROUP
                // ================================
                capaColegios = L.markerClusterGroup({
                    spiderfyOnMaxZoom: true,
                    showCoverageOnHover: false,
                    maxClusterRadius: 80,
                

                    iconCreateFunction: function (cluster) {

                        const markers = cluster.getAllChildMarkers();

                        let suma = 0;
                        markers.forEach(marker => {
                            suma += marker.feature.properties[pruebaActiva];
                        });

                        const promedio = suma / markers.length;
                        const color = colorPorPuntaje(promedio);

                        return L.divIcon({
                            html: `
                                <div style="
                                    background:${color};
                                    width:45px;
                                    height:45px;
                                    border-radius:50%;
                                    display:flex;
                                    align-items:center;
                                    justify-content:center;
                                    color:white;
                                    font-weight:bold;
                                    border:2px solid white;
                                ">
                                    ${markers.length}
                                </div>
                            `,
                            className: "",
                            iconSize: [45, 45]
                        });
                    }
                });

                // ================================
                // GEOJSON
                // ================================
                const geojsonLayer = L.geoJSON(data, {

                    pointToLayer: (feature, latlng) => {

                        const valor = feature.properties[pruebaActiva];
                        const color = colorPorPuntaje(valor);
                        const size = tamañoPorZoom(map.getZoom());

                        return L.marker(latlng, {
                            icon: L.divIcon({
                                html: `
                                    <div style="
                                        width:${size}px;
                                        height:${size}px;
                                        background:${color};
                                        border-radius:50%;
                                        border:2px solid #333;
                                    "></div>
                                `,
                                className: "",
                                iconSize: [size, size]
                            })
                        });
                    },

                    onEachFeature: (feature, layer) => {

                        layer.bindPopup(`
                            <b>${feature.properties.NOM_RBD}</b><br>
                            Lenguaje: ${feature.properties.Lenguaje}<br>
                            M1: ${feature.properties.M1}<br>
                            M2: ${feature.properties.M2}<br>
                            Historia: ${feature.properties.Historia}<br>
                            Ciencias: ${feature.properties.Ciencias}<br>
                            Obligatoria: ${feature.properties.Obligatoria}
                        `);

                        layer.on("mouseover", () => {
                            const valor = feature.properties[pruebaActiva];
                            layer.bindTooltip(
                                `<b>${feature.properties.NOM_RBD}</b><br>
                                 ${pruebaActiva}: <b>${valor}</b>`,
                                { sticky: true }
                            ).openTooltip();
                        });

                        layer.on("mouseout", () => {
                            layer.closeTooltip();
                        });
                    }
                });

                capaColegios.addLayer(geojsonLayer);
                map.addLayer(capaColegios);

                legend.remove();
                legend.addTo(map);
                document.getElementById("subtitulo-prueba").textContent = pruebaActiva;
            }

            dibujarMapa();

            // ================================
            // BOTONES DE PRUEBA
            // ================================
            document.querySelectorAll(".btn-prueba").forEach(btn => {
                btn.addEventListener("click", () => {

                    document.querySelectorAll(".btn-prueba")
                        .forEach(b => b.classList.remove("active"));

                    btn.classList.add("active");

                    pruebaActiva = btn.dataset.prueba;

                    dibujarMapa();
                });
            });

            console.log("✅ Mapa funcionando con spiderfy real");
        })
        .catch(err => console.error("❌ Error cargando GeoJSON", err));
});