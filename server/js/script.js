let chart;

document.addEventListener("DOMContentLoaded", async function () {
    let request = await fetch("/data/log.json");
    let json = await request.json();
    let mode = document.getElementsByTagName("select")[0];
    let filter = document.getElementById("filter");

    // json = json.sort((ping1, ping2) => {
    //     let [h1, m1, s1] = ping1.time.split(":");
    //     let [h2, m2, s2] = ping2.time.split(":");

    //     ping1 = Number(h1) * 60 * 60 + Number(m1) * 60 + Number(s1);
    //     ping2 = Number(h2) * 60 * 60 + Number(m2) * 60 + Number(s2);

    //     if (ping1 > ping2) return 1;

    //     if (ping2 > ping1) return -1;

    //     return 0;
    // });

    chart = new Chart(document.getElementById("chart"), {
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
                        },
                    },
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false,
                },
            },
            elements: {
                point: {
                    radius: 0,
                },
            },
            animation: {
                duration: 0,
            },
            scales: {
                y: {
                    min: 0,
                    suggestedMax: 35,
                },
            },
        },
    });

    io().on("ping", (ping) => {
        json.push(ping);

        let labels = [];
        let data = [];
        let input = Number(filter.value);

        switch (mode.value) {
            case "recent":
                input = input || 100;

                json.slice(-input).forEach((ping) => {
                    labels.push(ping.time);
                    data.push(ping.value);
                });
                break;

            case "all":
                json.forEach((ping) => {
                    labels.push(ping.time);
                    data.push(ping.value);
                });
                break;

            case "peaks":
                input = input || 75;

                json.forEach((ping) => {
                    if (ping.value > input) {
                        labels.push(ping.time);
                        data.push(ping.value);
                    }
                });
                break;

            case "troughs":
                input = input || 5;

                json.forEach((ping) => {
                    if (ping.value < input) {
                        labels.push(ping.time);
                        data.push(ping.value);
                    }
                });
        }

        chart.data.labels = labels;
        chart.data.datasets[0].data = data;

        chart.update();
    });
});
