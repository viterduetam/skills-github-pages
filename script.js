// Вкажіть URL вашого опублікованого листа Google Sheets у форматі CSV.
// Як отримати: "Файл" → "Опублікувати в інтернеті" → вибрати CSV → отримати лінк.
const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSma72n2A3Ix2t24N5M1sVX4Rj8hPIIW9wNgsTVGT3Ux0HTq3evn9LlIYBQovR5hxad0kXnPaXjPpYT/pub?output=csv';
const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(sheetUrl);

fetch(proxyUrl)
  .then(response => response.json())
  .then(data => {
    // 'data.contents' містить текст CSV
    const csvData = data.contents;
    // Тут ваш код обробки csvData
  })
  .catch(error => console.error(error));

// Масив подій (завантажується з Google Sheets)
let events = [];

// Отримуємо посилання на елементи
const form = document.getElementById('add-event-form');
const eventNameInput = document.getElementById('event-name');
const eventDateInput = document.getElementById('event-date');
const eventTimeInput = document.getElementById('event-time');
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

            // Очікуємо, що в CSV будуть колонки name, date, time
            // Якщо назви інші, скоригуйте відповідно
            events = eventsFromSheet.map(e => {
                const eventTime = new Date(`${e.date} ${e.time}`).getTime();
                return {
                    id: Date.now() + Math.random(), // унікальний ID
                    name: e.name,
                    time: eventTime,
                    remaining: ''
                };
            });

            // Після завантаження відразу оновимо відліки
            updateCountdowns();
        })
        .catch(error => {
            console.error('Помилка завантаження даних з Google Sheets:', error);
        });
}

// Функція оновлення відліку до подій
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

        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'buttons';

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-event';
        editBtn.textContent = 'Редагувати';
        editBtn.addEventListener('click', () => {
            editEvent(event.id);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-event';
        deleteBtn.textContent = 'Видалити';
        deleteBtn.addEventListener('click', () => {
            deleteEvent(event.id);
        });

        buttonsDiv.appendChild(editBtn);
        buttonsDiv.appendChild(deleteBtn);

        eventEl.appendChild(nameEl);
        eventEl.appendChild(timeEl);
        eventEl.appendChild(buttonsDiv);

        countdownContainer.appendChild(eventEl);
    });
}

// Додавання події вручну (тільки локально, не у Google Sheets)
function addEvent(name, date, time) {
    const dateTimeStr = date + ' ' + time;
    const eventTime = new Date(dateTimeStr).getTime();

    const newEvent = {
        id: Date.now(),
        name: name,
        time: eventTime,
        remaining: ''
    };

    events.push(newEvent);
    updateCountdowns();
}

// Видалення події (локально)
function deleteEvent(id) {
    events = events.filter(e => e.id !== id);
    renderEvents();
}

// Редагування події (локально)
function editEvent(id) {
    const eventToEdit = events.find(e => e.id === id);
    if (!eventToEdit) return;

    const newName = prompt("Введіть нову назву події:", eventToEdit.name);
    if (newName === null) return;

    const currentTime = new Date(eventToEdit.time);
    const currentDateStr = currentTime.toISOString().split('T')[0];
    const currentHours = String(currentTime.getHours()).padStart(2, '0');
    const currentMinutes = String(currentTime.getMinutes()).padStart(2, '0');
    const defaultTimePrompt = `${currentHours}:${currentMinutes}`;

    const newDate = prompt("Введіть нову дату (РРРР-ММ-ДД):", currentDateStr);
    if (newDate === null) return;

    const newTime = prompt("Введіть новий час (ГГ:ХХ):", defaultTimePrompt);
    if (newTime === null) return;

    if (!newName.trim() || !newDate || !newTime) {
        alert("Неправильні дані. Редагування скасоване.");
        return;
    }

    const newEventTime = new Date(`${newDate} ${newTime}`).getTime();
    if (isNaN(newEventTime)) {
        alert("Невірний формат дати чи часу.");
        return;
    }

    eventToEdit.name = newName.trim();
    eventToEdit.time = newEventTime;

    updateCountdowns();
}

// Обробка додавання нових подій через форму (локально)
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = eventNameInput.value.trim();
    const date = eventDateInput.value;
    const time = eventTimeInput.value;

    if(name && date && time) {
        addEvent(name, date, time);
        eventNameInput.value = '';
        eventDateInput.value = '';
        eventTimeInput.value = '';
    }
});

// Запускаємо оновлення кожну секунду
setInterval(updateCountdowns, 1000);

// Завантажуємо дані з Google Sheets при завантаженні сторінки
loadEventsFromSheet();
