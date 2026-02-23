// ================================
// FUNCIÓN DE COLOR SEGÚN PUNTAJE
// ================================
function colorPorPuntaje(valor) {
    return valor > 650 ? "#1a9850" :
           valor > 550 ? "#66bd63" :
           valor > 450 ? "#fee08b" :
                         "#d73027";
}

function radioPorZoom(zoom) {
    if (zoom <= 12) return 5;
    if (zoom === 13) return 7;
    if (zoom === 14) return 9;
    if (zoom === 15) return 11;
    return 13;
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
            opacity: 0.8
        }
    ).addTo(map);
    
    L.control.layers(
        {  "Satelital": satelital, "Claro": positron, "Oscuro": dark },
        null,
        { position: "topright" }
    ).addTo(map);

    
    // ================================
    // LEYENDA DINÁMICA
    // ================================
    const legend = L.control({ position: "bottomright" });

    legend.onAdd = function () {
        const div = L.DomUtil.create("div", "info legend");
        div.innerHTML = `
            <strong>${pruebaActiva}</strong><br>
            <i style="background:#1a9850"></i> &gt; 650<br>
            <i style="background:#66bd63"></i> 550 – 650<br>
            <i style="background:#fee08b"></i> 450 – 550<br>
            <i style="background:#d73027"></i> &lt; 450
        `;
        return div;
    };

    legend.addTo(map);
    map.on("zoomend", () => {
    if (!capaColegios) return;

    const zoom = map.getZoom();

    capaColegios.eachLayer(layer => {
        layer.setRadius(radioPorZoom(zoom));
    });
    });

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

                // Crear grupo cluster
                capaColegios = L.markerClusterGroup({
                showCoverageOnHover: false,
                spiderfyOnMaxZoom: true,

                // 👇 Hace que el cluster dure más antes de separarse
                disableClusteringAtZoom: 12,

                // 👇 Aumenta el radio de agrupación
                maxClusterRadius: 80,

                iconCreateFunction: function (cluster) {

                    const markers = cluster.getAllChildMarkers();

                    // Calcular promedio del cluster según prueba activa
                    let suma = 0;
                    markers.forEach(marker => {
                     suma += marker.feature.properties[pruebaActiva];
                    });

                    const promedioCluster = suma / markers.length;

                 const color = colorPorPuntaje(promedioCluster);

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


                const geojsonLayer = L.geoJSON(data, {
                    pointToLayer: (feature, latlng) => {
                        const valor = feature.properties[pruebaActiva];

                        return L.circleMarker(latlng, {
                            radius: radioPorZoom(map.getZoom()),
                            fillColor: colorPorPuntaje(valor),
                            color: "#333",
                            weight: 1,
                            fillOpacity: 0.9
                        });
                    },

                    onEachFeature: (feature, layer) => {

                        // ================================
                        // POPUP (CLICK)
                        // ================================
                        layer.bindPopup(`
                            <b>${feature.properties.establecimiento}</b><br>
                            Lenguaje: ${feature.properties.Lenguaje}<br>
                            M1: ${feature.properties.M1}<br>
                            M2: ${feature.properties.M2}<br>
                            Historia: ${feature.properties.Historia}<br>
                            Ciencias: ${feature.properties.Ciencias}<br>
                            Obligatoria: ${feature.properties.Obligatoria}
                        `);

                        // ================================
                        // TOOLTIP (HOVER)
                        // ================================
                        layer.on("mouseover", () => {
                            const valor = feature.properties[pruebaActiva];
                            layer.bindTooltip(
                                `<b>${feature.properties.establecimiento}</b><br>
                                 ${pruebaActiva}: <b>${valor}</b>`,
                                { sticky: true, opacity: 0.95 }
                            ).openTooltip();
                        });

                        layer.on("mouseout", () => {
                            layer.closeTooltip();
                        });

                        // ================================
                        // CLICK → RESALTAR COLEGIO
                        // ================================
                        layer.on("click", () => {

                            capaColegios.eachLayer(l => {
                                l.setStyle({
                                    radius: 8,
                                    weight: 1,
                                    fillOpacity: 0.3
                                });
                            });

                            layer.setStyle({
                                radius: 12,
                                weight: 3,
                                fillOpacity: 1
                            });
                        });

                        layer.on("popupclose", () => {
                            capaColegios.eachLayer(l => {
                                l.setStyle({
                                    radius: 8,
                                    weight: 1,
                                    fillOpacity: 0.9
                                });
                            });
                        });
                    }
                });

                capaColegios.addLayer(geojsonLayer);
                map.addLayer(capaColegios);


                // actualizar leyenda y subtítulo
                legend.remove();
                legend.addTo(map);
                document.getElementById("subtitulo-prueba").textContent = pruebaActiva;
            }

            dibujarMapa();

            // ================================
            // SELECTOR DE PRUEBAS
            // ================================
// ================================
// SELECTOR DE PRUEBAS (BOTONES)
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
            console.log("✅ Mapa completo y funcional");
        })
        .catch(err => console.error("❌ Error cargando GeoJSON", err));
});
