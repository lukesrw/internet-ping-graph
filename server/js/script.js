let json;

/**
 * User controls
 */
let mode;
let modePredicate;
let input = 100;

/**
 * Chart.js variables
 */
let labels = [];
let data = [];

function updatePredicate() {
    switch (mode.value) {
        case "recent":
            modePredicate = function () {
                return true;
            };
            break;

        case "peaks":
            modePredicate = function (ping) {
                return ping.value > (input || 75);
            };
            break;

        case "troughs":
            modePredicate = function (ping) {
                return ping.value < input;
            };
            break;

        case "timeouts":
            modePredicate = function (ping) {
                return ping.value == 0;
            };
            break;
    }

    labels = [];
    data = [];

    json.slice(mode.value === "recent" ? -(input || 100) : 0).forEach(function (
        ping
    ) {
        if (modePredicate(ping)) {
            labels.push(ping.time);
            data.push(ping.value);
        }
    });
}

document.addEventListener("DOMContentLoaded", async function () {
    let request = await fetch("/data/log.json");
    json = await request.json();

    let filter = document.getElementById("filter");
    filter.addEventListener("change", function () {
        input = Number(filter.value);
    });

    mode = document.getElementsByTagName("select")[0];
    mode.addEventListener("change", updatePredicate);
    updatePredicate();

    let chart = new Chart(document.getElementById("chart"), {
        type: "line",
        data: {
            labels: [],
            datasets: [
                {
                    label: "Ping",
                    data: [],
                    borderColor: "rgb(255,0,0)",
                    borderWidth: 1,
                    fill: false,
                    cubicInterpolationMode: "monotone",
                    tension: 0.4,
                    segment: {
                        borderColor: (ctx) => {
                            let point = Math.max(
                                ctx.p0.parsed.y,
                                ctx.p1.parsed.y
                            );

                            if (point >= 100) {
                                return "rgb(219,123,43)";
                            } else if (point >= 25) {
                                return "rgb(231,180,22)";
                            } else if (point < 1) {
                                return "rgb(204,50,50)";
                            } else {
                                return "rgb(45,201,55)";
                            }
                        }
                    }
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            elements: {
                point: {
                    radius: 0
                }
            },
            animation: {
                duration: 0
            },
            scales: {
                y: {
                    min: 0,
                    suggestedMax: 35
                }
            }
        }
    });

    io().on("ping", (ping) => {
        json.push(ping);

        if (modePredicate(ping)) {
            labels.push(ping.time);
            data.push(ping.value);
        }

        chart.data.labels = labels;
        chart.data.datasets[0].data = data;

        chart.update();
    });
});
