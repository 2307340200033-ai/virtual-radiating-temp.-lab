// --- Chart setup ---
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
  },
  options: {
    animation: false,
    scales: {
      x: { title: { display: true, text: 'Time (s)' } },
      y: { title: { display: true, text: 'Temperature (°C)' } }
    }
  }
});

// --- Simulation variables ---
let T = 25;       // initial temperature (°C)
let time = 0;     // simulation time (s)
const dt = 0.1;   // time step (s)
let iSum = 0;     // integral term
let ePrev = 0;    // previous error
let energy = 0;   // total energy used (J)

// --- Metrics variables ---
let riseTime = null;
let overshoot = 0;
let settlingTime = null;
let setpointReached = false;
let lastSetpoint = Number(document.getElementById('setpoint').value);

// --- Control function ---
function control(setpoint, mode, kp, ki, kd, e) {
  if (mode === 'OFF') return 0;

  if (mode === 'ONOFF') {
    return (T < setpoint - 0.5) ? 200 : 0; // heater max power
  }

  if (mode === 'P') {
    return Math.max(0, Math.min(200, kp * e));
  }

  if (mode === 'PID') {
    iSum += e * dt;                     // integral
    const d = (e - ePrev) / dt;         // derivative
    let u = kp * e + ki * iSum + kd * d;
    ePrev = e;
    return Math.max(0, Math.min(200, u)); // clamp between 0 and 200 W
  }

  return 0;
}

// --- Simulation step ---
function step() {
  const setpoint = Number(document.getElementById('setpoint').value);
  document.getElementById('setpointVal').textContent = setpoint + " °C";

  const mode = document.getElementById('controller').value;
  const kp = Number(document.getElementById('kp').value);
  const ki = Number(document.getElementById('ki').value);
  const kd = Number(document.getElementById('kd').value);

  // --- Reset metrics if setpoint changes ---
  if (setpoint !== lastSetpoint) {
    riseTime = null;
    overshoot = 0;
    settlingTime = null;
    setpointReached = false;
    energy = 0;
    chart.data.labels = [];
    chart.data.datasets[0].data = [];
    lastSetpoint = setpoint;
    time = 0;
    T = 25; // reset temperature to ambient
  }

  const e = setpoint - T;
  const u = control(setpoint, mode, kp, ki, kd, e);

  // --- Thermal model: heater + convection loss ---
  const convLoss = 5 * (T - 25);       // convection to ambient
  const dTdt = (u - convLoss) / 500;   // 500 J/K thermal capacitance
  T += dTdt * dt;
  time += dt;

  // --- Energy usage ---
  energy += u * dt; // Joules (W * s)

  // --- Metrics calculations ---
  if (!setpointReached && T >= setpoint) {
    riseTime = time.toFixed(1);
    setpointReached = true;
  }

  if (T > setpoint) {
    overshoot = Math.max(overshoot, ((T - setpoint) / setpoint * 100).toFixed(1));
  }

  if (Math.abs(T - setpoint) < 0.02 * setpoint && settlingTime === null && setpointReached) {
    settlingTime = time.toFixed(1);
  }

  // --- Update chart ---
  chart.data.labels.push(time.toFixed(1));
  chart.data.datasets[0].data.push(T);

  if (chart.data.labels.length > 200) { // limit points
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }

  chart.update();

  // --- Update metrics display ---
  document.getElementById('rise').textContent = riseTime || "—";
  document.getElementById('overshoot').textContent = overshoot + " %";
  document.getElementById('settling').textContent = settlingTime || "—";
  document.getElementById('energy').textContent = energy.toFixed(1) + " J";
}

// --- Run simulation ---
setInterval(step, dt * 1000);
