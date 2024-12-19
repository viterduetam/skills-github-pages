// Вставте ваш URL до опублікованого CSV
const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSma72n2A3Ix2t24N5M1sVX4Rj8hPIIW9wNgsTVGT3Ux0HTq3evn9LlIYBQovR5hxad0kXnPaXjPpYT/pub?output=csv';

let events = [];
const countdownContainer = document.getElementById('countdown-container');

// Функція розбору CSV у масив об'єктів
function parseCSV(csvString) {
    const lines = csvString.trim().split('\n');
    const headers = lines[0].split(',');

    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        let obj = {};
        headers.forEach((header, index) => {
            obj[header.trim()] = values[index] ? values[index].trim() : '';
        });
        result.push(obj);
    }
    return result;
}

// Завантаження подій з Google Sheets
function loadEventsFromSheet() {
    fetch(sheetUrl)
        .then(response => response.text())
        .then(csvData => {
            const eventsFromSheet = parseCSV(csvData);
            // Очікуємо колонки: name, date, time
            events = eventsFromSheet.map(e => {
                const eventTime = new Date(`${e.date}T${e.time}`).getTime();
                return {
                    id: Date.now() + Math.random(),
                    name: e.name,
                    time: eventTime,
                    remaining: ''
                };
            });
            updateCountdowns();
        })
        .catch(error => {
            console.error('Помилка завантаження даних з Google Sheets:', error);
        });
}

function updateCountdowns() {
    const now = new Date().getTime();

    events.forEach(event => {
        const distance = event.time - now;
        if (distance <= 0) {
            event.remaining = "Подія настала!";
        } else {
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            event.remaining = `${days}д ${hours}г ${minutes}хв ${seconds}с`;
        }
    });

    // Сортуємо події за часом, що залишився
    events.sort((a, b) => {
        const now = Date.now();
        return (a.time - now) - (b.time - now);
    });

    renderEvents();
}

function renderEvents() {
    countdownContainer.innerHTML = '';
    events.forEach(event => {
        const eventEl = document.createElement('div');
        eventEl.className = 'countdown';

        const nameEl = document.createElement('div');
        nameEl.className = 'event-name';
        nameEl.textContent = event.name;

        const timeEl = document.createElement('div');
        timeEl.className = 'time-remaining';
        timeEl.textContent = event.remaining;

        eventEl.appendChild(nameEl);
        eventEl.appendChild(timeEl);

        countdownContainer.appendChild(eventEl);
    });
}

// Запускаємо оновлення кожну секунду
setInterval(updateCountdowns, 1000);

// Завантажуємо дані з Google Sheets при завантаженні сторінки
loadEventsFromSheet();
