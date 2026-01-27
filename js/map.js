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
    ).addTo(map);

    const dark = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { attribution: "&copy; CARTO" }
    );

    L.control.layers(
        { "Claro": positron, "Oscuro": dark },
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

                capaColegios = L.geoJSON(data, {
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
                }).addTo(map);

                // actualizar leyenda y subtítulo
                legend.remove();
                legend.addTo(map);
                document.getElementById("subtitulo-prueba").textContent = pruebaActiva;
            }

            dibujarMapa();

            // ================================
            // SELECTOR DE PRUEBAS
            // ================================
            document
                .getElementById("selector-prueba")
                .addEventListener("change", (e) => {
                    pruebaActiva = e.target.value;
                    dibujarMapa();
                });

            console.log("✅ Mapa completo y funcional");
        })
        .catch(err => console.error("❌ Error cargando GeoJSON", err));
});
