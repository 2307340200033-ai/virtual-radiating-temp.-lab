const ctx = document.getElementById('tempChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Temperature (°C)',
      data: [],
      borderColor: 'red',
      fill: false
    }]
  }
});

let T = 25; // initial temperature
let time = 0;
const dt = 0.1;

function step() {
  const setpoint = Number(document.getElementById('setpoint').value);
  document.getElementById('setpointVal').textContent = setpoint + " °C";

  // simple control: heater on if below setpoint
  const u = (T < setpoint) ? 50 : 0;

  // thermal model (simplified)
  const dTdt = (u - 5*(T-25)) / 500;
  T += dTdt * dt;
  time += dt;

  chart.data.labels.push(time.toFixed(1));
  chart.data.datasets[0].data.push(T);
  chart.update();
}

setInterval(step, dt*1000);