document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 0. 전역 요소 및 상태 관리
    // ----------------------------------------------------
    const $calendarGrid = document.getElementById('calendar-grid');
    const $monthSelect = document.getElementById('month-select');
    const $yearSelect = document.getElementById('year-select');
    const $currentTime = document.getElementById('current-time');
    const $currentDate = document.getElementById('current-date');
    const $todoList = document.getElementById('todo-list');
    const $newTodoText = document.getElementById('new-todo-text');
    const $addTodoBtn = document.getElementById('add-todo-btn');
    const $upcomingEventsList = document.getElementById('upcoming-events-list');

    // 모달 요소
    const $eventModalOverlay = document.getElementById('event-modal-overlay');
    const $addEventBtn = document.getElementById('add-event-btn');
    const $saveEventBtn = document.getElementById('save-event-btn');
    const $eventText = document.getElementById('event-text');
    const $eventDate = document.getElementById('event-date');
    const $eventTime = document.getElementById('event-time');

    const $qtModalOverlay = document.getElementById('qt-modal-overlay');
    const $qtDisplayDate = document.getElementById('qt-display-date');
    const $qtVerseText = document.getElementById('qt-verse-text'); 
    const $saveQtBtn = document.getElementById('save-qt-btn');
    // QT Textarea 변수 6개
    const $qtTextarea1 = document.getElementById('qt-textarea-1');
    const $qtTextarea2 = document.getElementById('qt-textarea-2');
    const $qtTextarea3 = document.getElementById('qt-textarea-3');
    const $qtTextarea4 = document.getElementById('qt-textarea-4'); 
    const $qtTextarea5 = document.getElementById('qt-textarea-5'); 
    const $qtTextarea6 = document.getElementById('qt-textarea-6'); 
    
    // 모달 닫기 버튼들 (오류 수정 핵심)
    const $closeBtns = document.querySelectorAll('.close-btn'); 

    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth(); // 0-11
    let selectedDate = null; // 현재 선택된 캘린더 날짜 (Date 객체)
    
    // 데이터 저장소 (로컬 스토리지를 사용할 경우를 대비한 구조)
    let calendarData = JSON.parse(localStorage.getItem('calendarData')) || {};
    let todoItems = JSON.parse(localStorage.getItem('todoItems')) || [];

    const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    // 랜덤 말씀 구절 리스트
    const VERSE_LIST = [
        '로마서 8장 28절: 하나님을 사랑하는 자 곧 그의 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라.',
        '시편 23편 1절: 여호와는 나의 목자시니 내게 부족함이 없으리로다.',
        '요한복음 3장 16절: 하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라.',
        '빌립보서 4장 13절: 내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라.',
        '이사야 41장 10절: 두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라 내가 너를 굳세게 하리라 참으로 너를 도와주리라 참으로 나의 의로운 오른손으로 너를 붙들리라.',
        '마태복음 6장 33절: 그런즉 너희는 먼저 그의 나라와 그의 의를 구하라 그리하면 이 모든 것을 너희에게 더하시리라.'
    ];

    // ----------------------------------------------------
    // 1. 초기 로드 및 시간 업데이트 (변경 없음)
    // ----------------------------------------------------

    function updateTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
        const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
        
        $currentTime.textContent = timeStr.replace('오전', 'AM').replace('오후', 'PM');
        $currentDate.textContent = dateStr;
    }

    function populateSelects() {
        // 월 선택 드롭다운 채우기
        $monthSelect.innerHTML = MONTHS.map((month, index) => 
            `<option value="${index}" ${index === currentMonth ? 'selected' : ''}>${month}</option>`
        ).join('');

        // 연도 선택 드롭다운 채우기
        const startYear = currentYear - 5;
        const endYear = currentYear + 5;
        $yearSelect.innerHTML = '';
        for (let year = startYear; year <= endYear; year++) {
            $yearSelect.innerHTML += `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`;
        }
    }

    // ----------------------------------------------------
    // 2. 캘린더 기능 (변경 없음)
    // ----------------------------------------------------

    function getFormattedDateKey(date) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    function renderCalendar() {
        $calendarGrid.innerHTML = '';
        const today = new Date();
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        
        // 이전 달의 날짜 계산
        let startDayIndex = firstDayOfMonth.getDay(); // 0(일) ~ 6(토)
        
        // 이전 달의 마지막 날짜
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

        // 1. 이전 달 날짜 채우기 (Faded)
        for (let i = startDayIndex; i > 0; i--) {
            const date = prevMonthLastDay - i + 1;
            $calendarGrid.innerHTML += `<div class="date-cell faded">${date}</div>`;
        }

        // 2. 현재 달 날짜 채우기
        for (let date = 1; date <= daysInMonth; date++) {
            const dateObj = new Date(currentYear, currentMonth, date);
            const dateKey = getFormattedDateKey(dateObj);
            
            let classList = 'date-cell';
            
            // 오늘 날짜 표시
            if (dateObj.toDateString() === today.toDateString()) {
                classList += ' today-active';
            }

            // QT 또는 Event 데이터가 있는지 확인하고 점 표시
            if (calendarData[dateKey] && (calendarData[dateKey].qt || (calendarData[dateKey].events && calendarData[dateKey].events.length > 0))) {
                classList += ' highlight-dot';
            }

            $calendarGrid.innerHTML += `<div class="${classList}" data-date="${dateKey}">${date}</div>`;
        }

        // 3. 다음 달 날짜 채우기 (Faded)
        const totalCells = startDayIndex + daysInMonth;
        const remainingCells = 42 - totalCells; // 최대 6주 (6 * 7 = 42)
        
        for (let i = 1; i <= remainingCells; i++) {
            // 최소 42칸을 채우거나, 마지막 주가 토요일까지 채워지도록 함
            if (totalCells + i > 42 && (totalCells + i - 1) % 7 === 0) break;
            $calendarGrid.innerHTML += `<div class="date-cell faded">${i}</div>`;
        }
    }

    function handleCalendarChange() {
        currentYear = parseInt($yearSelect.value);
        currentMonth = parseInt($monthSelect.value);
        renderCalendar();
        renderUpcomingEvents();
    }

    function handleCalendarNavigation(delta) {
        currentMonth += delta;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        } else if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        $yearSelect.value = currentYear;
        $monthSelect.value = currentMonth;
        renderCalendar();
        renderUpcomingEvents();
    }
    
    // ----------------------------------------------------
    // 3. ToDo 리스트 기능 (변경 없음)
    // ----------------------------------------------------

    function saveTodoItems() {
        localStorage.setItem('todoItems', JSON.stringify(todoItems));
    }

    function renderTodoList() {
        $todoList.innerHTML = '';
        if (todoItems.length === 0) {
            $todoList.innerHTML = '<li style="color:var(--faded-text); padding: 10px 0;">작성된 할 일이 없습니다.</li>';
            return;
        }

        todoItems.forEach((item, index) => {
            const listItem = document.createElement('li');
            listItem.className = item.completed ? 'completed' : '';
            listItem.dataset.index = index;
            
            listItem.innerHTML = `
                <span class="todo-text">${item.text}</span>
                <button class="delete-btn"><i class="fas fa-trash-alt"></i></button>
            `;
            
            $todoList.appendChild(listItem);
        });
    }

    function addTodoItem() {
        const text = $newTodoText.value.trim();
        if (text) {
            todoItems.push({ text: text, completed: false });
            $newTodoText.value = '';
            saveTodoItems();
            renderTodoList();
        }
    }

    function toggleTodoCompletion(index) {
        if (todoItems[index]) {
            todoItems[index].completed = !todoItems[index].completed;
            saveTodoItems();
            renderTodoList();
        }
    }

    function deleteTodoItem(index) {
        todoItems.splice(index, 1);
        saveTodoItems();
        renderTodoList();
    }

    // ----------------------------------------------------
    // 4. 이벤트 (Event) 기능 (변경 없음)
    // ----------------------------------------------------

    function saveCalendarData() {
        localStorage.setItem('calendarData', JSON.stringify(calendarData));
        renderCalendar(); // 이벤트/QT 등록 시 캘린더 하이라이트 업데이트
        renderUpcomingEvents(); // 다가오는 이벤트 업데이트
    }

    // 다가오는 이벤트 목록 렌더링
    function renderUpcomingEvents() {
        $upcomingEventsList.innerHTML = '';
        const todayKey = getFormattedDateKey(new Date());
        let eventsToShow = [];

        // 오늘 이후의 이벤트를 [dateKey, event, localIndex] 형태로 수집
        Object.keys(calendarData).sort().forEach(dateKey => {
            if (dateKey >= todayKey && calendarData[dateKey].events) {
                // 이벤트 배열을 순회하며 로컬 인덱스(localIndex)를 포함하여 저장
                calendarData[dateKey].events.forEach((event, index) => { 
                    eventsToShow.push({
                        date: dateKey,
                        text: event.text,
                        time: event.time,
                        localIndex: index // 해당 날짜의 이벤트 배열 내 인덱스
                    });
                });
            }
        });
        
        if (eventsToShow.length === 0) {
            $upcomingEventsList.innerHTML = '<li style="color:var(--faded-text); padding: 10px 0;">등록된 일정이 없습니다.</li>';
            return;
        }

        // 최대 5개만 표시
        eventsToShow.slice(0, 5).forEach(event => {
            const timeStr = event.time ? `(${event.time})` : '';
            const listItem = document.createElement('li');
            
            // 삭제를 위해 date와 index를 data 속성으로 전달
            listItem.innerHTML = `
                <span class="event-text">${event.date.substring(5)} ${event.text}</span>
                <small style="color:var(--faded-text);">${timeStr}</small>
                <button class="event-delete-btn delete-btn" data-date="${event.date}" data-index="${event.localIndex}"><i class="fas fa-trash-alt"></i></button>
            `;
            $upcomingEventsList.appendChild(listItem);
        });
    }

    function saveEvent() {
        const dateKey = $eventDate.value;
        const text = $eventText.value.trim();
        const time = $eventTime.value;

        if (!dateKey || !text) {
            alert('날짜와 내용을 모두 입력해주세요.');
            return;
        }

        if (!calendarData[dateKey]) {
            calendarData[dateKey] = { events: [], qt: null };
        }

        // 기존 이벤트가 있으면 추가, 없으면 새로 생성
        calendarData[dateKey].events.push({ text, time });
        
        saveCalendarData();
        closeModal($eventModalOverlay);
        alert('이벤트가 등록되었습니다.');
    }
    
    // 다가오는 이벤트 삭제 함수 (변경 없음)
    function deleteEvent(dateKey, index) {
        if (calendarData[dateKey] && calendarData[dateKey].events) {
            // 인덱스 위치의 이벤트 삭제
            calendarData[dateKey].events.splice(index, 1); 
            
            // 이벤트 배열이 비어있고 QT 기록도 없다면 해당 날짜 데이터 자체를 제거합니다.
            if (calendarData[dateKey].events.length === 0 && !calendarData[dateKey].qt) {
                delete calendarData[dateKey];
            }
            
            saveCalendarData(); // localStorage 저장 및 캘린더/다가오는 이벤트 리렌더링
            alert('일정이 삭제되었습니다.');
        }
    }
    
    // ----------------------------------------------------
    // 5. QT (Quiet Time) 기능
    // ----------------------------------------------------
    
    function getRandomVerse() {
        const randomIndex = Math.floor(Math.random() * VERSE_LIST.length);
        return VERSE_LIST[randomIndex];
    }
    
    // ❗ [수정]: 6개 필드를 저장하도록 업데이트 (meditation1, 2, prayer, plus1, 2, 3)
    function saveQtRecord() {
        const dateKey = getFormattedDateKey(selectedDate);
        const qtRecord = {
            // 기존 3개 필드
            meditation1: $qtTextarea1.value.trim(),
            meditation2: $qtTextarea2.value.trim(),
            prayer: $qtTextarea3.value.trim(),
            
            // ❗ [추가]: 새로운 3개 필드 추가 (qtTextarea4, 5, 6)
            plus1: $qtTextarea4.value.trim(), 
            plus2: $qtTextarea5.value.trim(), 
            plus3: $qtTextarea6.value.trim(),
            
            // 말씀 구절 (고정)
            verse: $qtVerseText.textContent.trim() 
        };

        if (!calendarData[dateKey]) {
            calendarData[dateKey] = { events: [], qt: null };
        }
        
        calendarData[dateKey].qt = qtRecord;
        
        saveCalendarData();
        closeModal($qtModalOverlay);
        alert('QT 기록이 저장되었습니다.');
    }

    // ❗ [수정]: 6개 필드를 로드하도록 업데이트
    function loadQtRecord(dateKey) {
        const data = calendarData[dateKey] ? calendarData[dateKey].qt : null;
        
        // 말씀 구절 로직: 저장된 말씀이 있으면 고정, 없으면 랜덤 생성
        let verseToDisplay = '';
        if (data && data.verse) {
            verseToDisplay = data.verse; // 저장된 말씀 고정
        } else {
            verseToDisplay = getRandomVerse(); // 랜덤 말씀
        }
        $qtVerseText.textContent = verseToDisplay; // 말씀 표시
        
        if (data) {
            // 기존 3개 필드 로드
            $qtTextarea1.value = data.meditation1 || '';
            $qtTextarea2.value = data.meditation2 || '';
            $qtTextarea3.value = data.prayer || '';
            
            // ❗ [추가]: 새로운 3개 필드 로드
            $qtTextarea4.value = data.plus1 || ''; 
            $qtTextarea5.value = data.plus2 || ''; 
            $qtTextarea6.value = data.plus3 || '';

            $saveQtBtn.textContent = '수정하기';
        } else {
            // 데이터가 없으면 모든 필드 초기화
            $qtTextarea1.value = '';
            $qtTextarea2.value = '';
            $qtTextarea3.value = '';
            $qtTextarea4.value = ''; // 초기화
            $qtTextarea5.value = ''; // 초기화
            $qtTextarea6.value = ''; // 초기화
            $saveQtBtn.textContent = '저장하기';
        }
    }

    // ----------------------------------------------------
    // 6. 모달 제어 (변경 없음)
    // ----------------------------------------------------

    function openEventModal(dateObj) {
        // 모달 초기화
        $eventText.value = '';
        $eventTime.value = '';
        
        if (dateObj) {
            $eventDate.value = getFormattedDateKey(dateObj); // 캘린더에서 날짜 자동 입력
        } else {
            $eventDate.value = ''; // 직접 날짜 선택
        }
        
        $eventModalOverlay.classList.remove('hidden');
    }
    
    function openQtModal(dateObj) {
        selectedDate = dateObj;
        const dateKey = getFormattedDateKey(dateObj);
        
        $qtDisplayDate.textContent = dateKey;
        loadQtRecord(dateKey); // 해당 날짜의 QT 기록 및 말씀 로드
        
        $qtModalOverlay.classList.remove('hidden');
    }

    function closeModal(overlay) {
        overlay.classList.add('hidden');
    }

    // ----------------------------------------------------
    // 7. 이벤트 리스너 등록 (변경 없음)
    // ----------------------------------------------------

    // 캘린더 클릭 이벤트 (날짜 셀 클릭)
    $calendarGrid.addEventListener('click', (e) => {
        const cell = e.target.closest('.date-cell');
        if (cell && !cell.classList.contains('faded')) {
            const dateKey = cell.dataset.date;
            const dateObj = new Date(dateKey);
            
            // QT 모달 열기
            openQtModal(dateObj);
        }
    });

    // 캘린더 월/연도 변경
    $monthSelect.addEventListener('change', handleCalendarChange);
    $yearSelect.addEventListener('change', handleCalendarChange);

    // 캘린더 네비게이션 버튼
    document.getElementById('prev-month-btn').addEventListener('click', () => handleCalendarNavigation(-1));
    document.getElementById('next-month-btn').addEventListener('click', () => handleCalendarNavigation(1));

    // ToDo 리스트 추가
    $addTodoBtn.addEventListener('click', addTodoItem);
    $newTodoText.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodoItem();
    });

    // ToDo 리스트 항목 클릭 (완료 토글 및 삭제)
    $todoList.addEventListener('click', (e) => {
        const listItem = e.target.closest('li');
        if (!listItem) return;
        const index = parseInt(listItem.dataset.index);

        if (e.target.closest('.delete-btn')) {
            deleteTodoItem(index);
        } else if (e.target.closest('.todo-text')) {
            toggleTodoCompletion(index);
        }
    });

    // 이벤트 모달 열기
    $addEventBtn.addEventListener('click', () => openEventModal(null));

    // 이벤트 저장
    $saveEventBtn.addEventListener('click', saveEvent);

    // QT 기록 저장
    $saveQtBtn.addEventListener('click', saveQtRecord);

    // 다가오는 이벤트 삭제 버튼 클릭 이벤트 리스너
    $upcomingEventsList.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.event-delete-btn');
        if (deleteBtn) {
            const dateKey = deleteBtn.dataset.date;
            // dataset에서 가져오는 값은 문자열이므로 숫자로 변환
            const index = parseInt(deleteBtn.dataset.index); 
            
            if (confirm(`선택한 일정을 삭제하시겠습니까? (${dateKey.substring(5)})`)) {
                deleteEvent(dateKey, index);
            }
        }
    });

    // 모달 닫기 버튼 (.close-btn) 이벤트 리스너
    $closeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget.dataset.closeModal; 
            
            if (target === 'event') {
                closeModal($eventModalOverlay);
            } else if (target === 'qt') {
                closeModal($qtModalOverlay);
            }
        });
    });

    // 오버레이 클릭 시 모달 닫기
    $eventModalOverlay.addEventListener('click', (e) => {
        if (e.target === $eventModalOverlay) closeModal($eventModalOverlay);
    });
    $qtModalOverlay.addEventListener('click', (e) => {
        if (e.target === $qtModalOverlay) closeModal($qtModalOverlay);
    });
    

    // ----------------------------------------------------
    // 8. 초기화 (변경 없음)
    // ----------------------------------------------------
    
    updateTime();
    setInterval(updateTime, 1000); // 1초마다 시간 업데이트
    populateSelects();
    renderCalendar();
    renderTodoList();
    renderUpcomingEvents();
});