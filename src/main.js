import firebaseConfig from './config';

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const ordersRef = database.ref('orders');
const loginForm = document.querySelector('.login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

function authenticateUser() {
        
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault(); 
        
        const email = emailInput.value; 
        const password = passwordInput.value; 
        firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log('Пользователь успешно вошел в систему:', user);
            window.location.href = 'main.html';
            
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error('Ошибка аутентификации:', errorMessage, errorCode );
        });
                
            });
}
document.addEventListener("DOMContentLoaded", function () {
    const tableBody = document.getElementById('table-body');
    let selectedCount = 0;
    let nameSortAsc = true;
    let timestampSortAsc = true;
    let priceSortAsc = true;
    let totalItems = 0;
    let currentPage = 1; 
    let totalPages = 0;
    let salesChart = null; 
    let myPieChart = null;
    let myDoughnutChart = null;
    const itemsPerPage = 10;
    const currentPageDisplay = document.getElementById('currentPage');
    const prevPageButton = document.getElementById('prevPage');
    const nextPageButton = document.getElementById('nextPage');
    const downloadButton = document.querySelector('.save-button');
    const staticCards = document.querySelector('.static-cards');
    const showStatics = document.getElementById('showStatics');
    if (showStatics) {
        showStatics.addEventListener('click', validateDateRange);
    }
    if (tableBody) {
        fetchDataAndPopulateTable();
        // updateStatisticsCards()
    }
    else if (staticCards) {
        calculateStatistics();
    }


    

    function fetchDataAndPopulateTable() {
        ordersRef.once('value')
            .then((snapshot) => {
                const ordersData = snapshot.val();
                
                Object.keys(ordersData).forEach((orderId, index) => {
                    const order = ordersData[orderId];
                    const requestData = order.request_data;
                    const row = document.createElement('tr');
                    const uniqueId = `myCheckbox${index}`;
                    totalItems++;

                    //console.log(ordersData);

                    function formatTimestamp(timestamp) {
                        const year = timestamp.substring(0, 4);
                        const month = timestamp.substring(4, 6);
                        const day = timestamp.substring(6, 8);
                        const hours = timestamp.substring(8, 10);
                        const minutes = timestamp.substring(10, 12);
                        const seconds = timestamp.substring(12, 14);
                    
                        return `${year}.${month}.${day},${hours}:${minutes}:${seconds}`;
                    }
                
                    row.innerHTML = `
                        <td>
                            <label class="checkbox">
                                <input class="checkbox-input" type="checkbox" id="${uniqueId}">
                                <svg class="checkbox-icon" viewBox="0 0 22 22">
                                    <rect width="23" height="23" x=".5" y=".5" fill="#FFF" stroke="#107C41" rx="6" />
                                    <path class="tick" stroke="#107C41" fill="none" stroke-linecap="round" stroke-width="4" d="M5 12l5 5 9-9" />
                                </svg>
                            </label>
                        </td>
                        <td class="column" data-field="name">${requestData.name}</td>
                        <td class="column" data-field="timestamp">${formatTimestamp(requestData.timestamp)}</td>
                        <td class="column" data-field="orderid">${requestData.orderid}</td>
                        <td class="column" data-field="price">${requestData.price + ' ₸' }</td>
                        <td class="column" data-field="status">${requestData.status}</td>
                        <td></td>
                        <td></td>
                    `;

                    const checkbox = row.querySelector(`#${uniqueId}`);
                    checkbox.addEventListener('change', () => {
                        if (checkbox.checked) {
                            selectedCount++; 
                        } else {
                            selectedCount--; 
                        }
                        document.getElementById('selectedCount').textContent = `Выбрано - ${selectedCount}`;
                    });

                    tableBody.appendChild(row);
                });

                totalPages = Math.ceil(totalItems / itemsPerPage);
                currentPage = 1;
                initializeSorting();
                updateTableDisplay()
            
            })
            .catch((error) => {
                console.error("error for table:", error);
            });
    }


    function initializeSorting() {
        const nameHeader = document.getElementById('nameHeader');
        const timestampHeader = document.getElementById('timestampHeader');
        const priceHeader = document.getElementById('priceHeader');
        const statusSelect = document.getElementById('statusSelect');

        nameHeader.addEventListener('click', () => {
            toggleSortIcon(nameHeader, 'name');
        });

        timestampHeader.addEventListener('click', () => {
            toggleSortIcon(timestampHeader, 'timestamp');
        });

        priceHeader.addEventListener('click', () => {
            toggleSortIcon(priceHeader, 'price');
        });

        statusSelect.addEventListener('change', () => {
            const selectedStatus = statusSelect.value;
            sortDataByStatus(selectedStatus);
        });
    }

    function sortByName(field) {
        const rows = Array.from(document.querySelectorAll('#table-body tr'));
        rows.sort((rowA, rowB) => {
            const contentA = rowA.querySelector(`.column[data-field="${field}"]`).textContent.toLowerCase();
            const contentB = rowB.querySelector(`.column[data-field="${field}"]`).textContent.toLowerCase();
            return nameSortAsc ? contentA.localeCompare(contentB) : contentB.localeCompare(contentA);
        });

        tableBody.innerHTML = '';
        rows.forEach(row => {
            tableBody.appendChild(row);
        });
    }

    function sortByTimestamp(field) {
        const rows = Array.from(document.querySelectorAll('#table-body tr'));
        rows.sort((rowA, rowB) => {
            const contentA = rowA.querySelector(`.column[data-field="${field}"]`).textContent;
            const contentB = rowB.querySelector(`.column[data-field="${field}"]`).textContent;
            return timestampSortAsc ? contentA.localeCompare(contentB) : contentB.localeCompare(contentA);
        });

        tableBody.innerHTML = '';
        rows.forEach(row => {
            tableBody.appendChild(row);
        });
    }

    function sortByPrice(field) {
        const rows = Array.from(document.querySelectorAll('#table-body tr'));
        rows.sort((rowA, rowB) => {
            const contentA = parseFloat(rowA.querySelector(`.column[data-field="${field}"]`).textContent);
            const contentB = parseFloat(rowB.querySelector(`.column[data-field="${field}"]`).textContent);
            return priceSortAsc ? contentA - contentB : contentB - contentA;
        });

        tableBody.innerHTML = '';
        rows.forEach(row => {
            tableBody.appendChild(row);
        });
    }

    function sortDataByStatus(selectedStatus) {
        const rows = Array.from(document.querySelectorAll('#table-body tr'));
        rows.forEach(row => {
            const statusCell = row.querySelector('.column[data-field="status"]').textContent.toLowerCase();
            if ((selectedStatus === 'paid' && statusCell === 'оплачен') || 
                (selectedStatus === 'all') || 
                (selectedStatus === 'unpaid' && statusCell === 'не оплачен')) {
                row.style.display = 'table-row';
            } else {
                row.style.display = 'none'; 
            }
        });
    }

    function toggleSortIcon(header, field) {
        const img = header.querySelector('img');
        switch (field) {
            case 'name':
                resetSortIconsExcept('nameHeader');
                nameSortAsc = !nameSortAsc;
                img.src = nameSortAsc ? "src/img/top.svg" : "src/img/bottom.svg";
                sortByName(field);
                break;
            case 'timestamp':
                resetSortIconsExcept('timestampHeader');
                timestampSortAsc = !timestampSortAsc;
                img.src = timestampSortAsc ? "src/img/top.svg" : "src/img/bottom.svg";
                sortByTimestamp(field);
                break;
            case 'price':
                resetSortIconsExcept('priceHeader');
                priceSortAsc = !priceSortAsc;
                img.src = priceSortAsc ? "src/img/top.svg" : "src/img/bottom.svg";
                sortByPrice(field);
                break;
            default:
                break;
        }
    }

    function resetSortIconsExcept(exceptHeaderId) {
        const headers = ['nameHeader', 'timestampHeader', 'priceHeader'];
        headers.forEach(headerId => {
            const header = document.getElementById(headerId);
            const img = header.querySelector('img');
            if (headerId === exceptHeaderId) {
                switch (exceptHeaderId) {
                    case 'nameHeader':
                        img.src = nameSortAsc ? "src/img/top.svg" : "src/img/bottom.svg";
                        break;
                    case 'timestampHeader':
                        img.src = timestampSortAsc ? "src/img/top.svg" : "src/img/bottom.svg";
                        break;
                    case 'priceHeader':
                        img.src = priceSortAsc ? "src/img/top.svg" : "src/img/bottom.svg";
                        break;
                    default:
                        break;
                }
            } else {
                img.src = "src/img/reset.svg";
            }
        });
    }


    function updateTableDisplay() {
        const itemsPerPage = 10; 
        const totalPages = Math.ceil(totalItems / itemsPerPage); 
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const rows = Array.from(document.querySelectorAll('#table-body tr'));
        rows.forEach(row => {
            row.style.display = 'none';
        });
        const currentRows = rows.slice(startIndex, endIndex);
        currentRows.forEach(row => {
            row.style.display = 'table-row';
        });
        currentPageDisplay.textContent = `${currentPage} из ${totalPages}`;
    }


    if (downloadButton) {
        downloadButton.addEventListener('click', exportToExcel);
    }

    function exportToExcel() {
        const allRows = document.querySelectorAll('#table-body tr');
        const data = [];
        allRows.forEach(row => {
            const rowData = [];
            row.querySelectorAll('.column').forEach(cell => {
                rowData.push(cell.textContent);
            });
            data.push(rowData);
        });

        
        const workbook = XLSX.utils.book_new();
        const sheet = XLSX.utils.aoa_to_sheet(data);

        XLSX.utils.book_append_sheet(workbook, sheet, 'Report');

        XLSX.writeFile(workbook, 'report.xlsx');
    }
    
    if (prevPageButton && nextPageButton){
        prevPageButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                updateTableDisplay();
            }
        });
    
        nextPageButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                updateTableDisplay();
            }
        });

    }

    function calculateStatistics() {
        ordersRef.once('value')
            .then((snapshot) => {
                const ordersData = snapshot.val();
                //console.log(ordersData)

                let totalIncome = 0;
                let returnsCount = 0;
                let clientsCount = 0;
    
                Object.keys(ordersData).forEach((orderId) => {
                    const order = ordersData[orderId];
                    const requestData = order.request_data;

                    if (requestData.status === 'Оплачен') {
                        totalIncome += requestData.price;
                    }
     
                    if (requestData.status !== 'Оплачен') {
                        returnsCount++;
                    }

                    if (requestData.status === 'Оплачен') {
                        clientsCount++;
                    }
                });
    
             
                
                let ordersCount = Object.keys(ordersData).length;
                const cards = staticCards.querySelectorAll('.card');

                
                if (staticCards) {
                    cards.forEach((card, index) => {
                        const staticNum = card.querySelector('.static-num');
                        const numTitle = card.querySelector('.num-title');
                        switch (index) {
                            case 0:
                                staticNum.textContent = clientsCount;
                                numTitle.textContent = 'платежей';
                                break;
                            case 1:
                                staticNum.textContent = ordersCount;
                                numTitle.textContent = 'заказов';
                                break;
                            case 2:
                                staticNum.textContent = totalIncome + ' ₸';
                                numTitle.textContent = 'прибыль';
                                break;
                            case 3:
                                staticNum.textContent = returnsCount;
                                numTitle.textContent = 'возврата';
                                break;
                            default:
                                break;
                        }
                    });
                }
            })
            .catch((error) => {
                console.error("error for statics:", error);
            });
    }

    async function generateDefaultCharts() {
        const now = new Date();
        const defaultEndDate = new Date(now); 
        const defaultStartDate = new Date(now); 
    

        defaultEndDate.setHours(0, 0, 0, 0); 
        defaultStartDate.setDate(1); 
        defaultStartDate.setHours(0, 0, 0, 0); 
    
        try {
            const snapshot = await ordersRef.once('value');
            const ordersData = snapshot.val();

            //console.log(defaultStartDate,defaultEndDate)
    
            const salesChartData = calculateIntervalDataForSalesChart(ordersData, defaultStartDate, defaultEndDate);
            const statusChartData = calculateIntervalDataForStatusChart(ordersData, defaultStartDate, defaultEndDate);
            const topsChartData = calculateIntervalDataForTopsChart(ordersData, defaultStartDate, defaultEndDate);
    
            return {
                salesChartData,
                statusChartData,
                topsChartData
            };
        } catch (error) {
            console.error("errors for static num 2:", error);
            return null;
        }
    }
    
    

    window.onload = async function () {
        if(staticCards){
            const defaultChartsData = await generateDefaultCharts();
            if (defaultChartsData) {
                const { salesChartData, statusChartData, topsChartData } = defaultChartsData;
                drawBarChart(salesChartData);
                drawPieChart(statusChartData);
                drawDoughnutChart(topsChartData);
            }

        }
        
    };
    async function validateDateRange() {
        const startDate = new Date(document.getElementById('start').value);
        const endDate = new Date(document.getElementById('end').value);
        
        try {
            const formattedStartDate = startDate;
            const formattedEndDate = endDate;
            const snapshot = await ordersRef.once('value');
            const ordersData = snapshot.val();

            //console.log(formattedStartDate, formattedEndDate)
            calculateIntervalDataForSalesChart(ordersData, formattedStartDate, formattedEndDate);
            calculateIntervalDataForStatusChart(ordersData, formattedStartDate, formattedEndDate);
            calculateIntervalDataForTopsChart(ordersData, formattedStartDate, formattedEndDate);
            
            //console.log('Interval Data:', intervalData);
    
            return true;
        } catch (error) {
            console.error("Ошибка при получении данных для статистики:", error);
            return false;
        }
    }


    function calculateIntervalDataForStatusChart(ordersData, startDate, endDate) {
        const intervals = {
            day: { paid: { count: 0, totalAmount: 0 }, unpaid: { count: 0, totalAmount: 0 } },
            week: { paid: { count: 0, totalAmount: 0 }, unpaid: { count: 0, totalAmount: 0 } },
            month: { paid: { count: 0, totalAmount: 0 }, unpaid: { count: 0, totalAmount: 0 } },
            year: { paid: { count: 0, totalAmount: 0 }, unpaid: { count: 0, totalAmount: 0 } }
        };
    
        let selectedInterval;
        const diffInDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
        if (diffInDays <= 1) {
            selectedInterval = 'day';
        } else if (diffInDays <= 7) {
            selectedInterval = 'week';
        } else if (diffInDays <= 31) {
            selectedInterval = 'month';
        } else {
            selectedInterval = 'year';
        }
    
        Object.keys(ordersData).forEach((orderId) => {
            const order = ordersData[orderId];
            const requestData = order.request_data;
            const orderTimestamp = requestData.timestamp;
    
            if (isWithinRange(orderTimestamp, startDate.getTime(), endDate.getTime())) {
                const status = requestData.status;
                const price = requestData.price || 0;
    
                switch (selectedInterval) {
                    case 'day':
                    case 'week':
                    case 'month':
                    case 'year':
                        const year = parseInt(orderTimestamp.substring(0, 4), 10);
                        const month = parseInt(orderTimestamp.substring(4, 6), 10) - 1;
                        const day = parseInt(orderTimestamp.substring(6, 8), 10);
                        const orderDate = new Date(year, month, day);
    
                        if (status === 'Оплачен') {
                            intervals[selectedInterval]['paid'].count++;
                            intervals[selectedInterval]['paid'].totalAmount += price;
                        } else {
                            intervals[selectedInterval]['unpaid'].count++;
                            intervals[selectedInterval]['unpaid'].totalAmount += price;
                        }
                        break;
                }
            }
        });
    
        drawPieChart(intervals[selectedInterval]); 
        const intervalData = {
            [selectedInterval]: intervals[selectedInterval]
        };
        return intervalData;
    }
    

    function calculateIntervalDataForSalesChart(ordersData, startDate, endDate) {
        const intervals = {
            day: {},
            week: {},
            month: {},
            year: {}
        };
    
        let selectedInterval;
        const diffInDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
        if (diffInDays <= 1) {
            selectedInterval = 'day';
        } else if (diffInDays <= 7) {
            selectedInterval = 'week';
        } else if (diffInDays <= 31) {
            selectedInterval = 'month';
        } else{
            selectedInterval = 'year';
        }
    
        Object.keys(ordersData).forEach((orderId) => {
            const order = ordersData[orderId];
            const requestData = order.request_data;
            const orderTimestamp = requestData.timestamp;
    
            if (isWithinRange(orderTimestamp, startDate.getTime(), endDate.getTime()) && requestData.status === 'Оплачен') {
                //const tsDate = new Date(parseInt(orderTimestamp, 10));
                let interval;
    
                switch (selectedInterval) {
                    case 'day':
                        const salesByHour = {
                            0: 0,   
                            1: 0,   
                            2: 0, 
                            3: 0,
                            4: 0,
                            5: 0,
                            6: 0,
                            7: 0,
                            8: 0,
                            9: 0,
                            10: 0,
                            11: 0,
                            12: 0,
                            13: 0,
                            14: 0,
                            15: 0,
                            16: 0,
                            17: 0,
                            18: 0,
                            19: 0,
                            20: 0,
                            21: 0,
                            22: 0,  
                            23: 0   
                        };

                        Object.keys(ordersData).forEach((orderId) => {
                            const order = ordersData[orderId];
                            const requestData = order.request_data;
                            const orderTimestamp = requestData.timestamp;

                            if (isWithinRange(orderTimestamp, startDate.getTime(), endDate.getTime()) && requestData.status === 'Оплачен') {
                                const year = parseInt(orderTimestamp.substring(0, 4));
                                const month = parseInt(orderTimestamp.substring(4, 6)) - 1;
                                const day = parseInt(orderTimestamp.substring(6, 8));
                                const hour = parseInt(orderTimestamp.substring(8, 10));

                                const tsDate = new Date(year, month, day, hour);
                                salesByHour[hour] += requestData.price;
                            }
                        });

                        intervals[selectedInterval] = salesByHour;
                        break;

                    case 'week':
                        const salesByDay = {
                            1: 0, 
                            2: 0, 
                            3: 0, 
                            4: 0, 
                            5: 0, 
                            6: 0, 
                            7: 0 
                        };
                    
                        Object.keys(ordersData).forEach((orderId) => {
                            const order = ordersData[orderId];
                            const requestData = order.request_data;
                            const orderTimestamp = requestData.timestamp;
                    
                            if (isWithinRange(orderTimestamp, startDate.getTime(), endDate.getTime()) && requestData.status === 'Оплачен') {
                                const year = parseInt(orderTimestamp.substring(0, 4));
                                const month = parseInt(orderTimestamp.substring(4, 6)) - 1;
                                const day = parseInt(orderTimestamp.substring(6, 8));
                    
                                const tsDate = new Date(year, month, day);
                                const dayOfWeek = tsDate.getDay();
                                salesByDay[dayOfWeek] += requestData.price;
                            }
                        });
                        intervals[selectedInterval] = salesByDay;
                        break;
                    case 'month':
                        const totalDays = diffInDays;
                        const totalWeeks = Math.ceil(totalDays / 7);
                        let weeklySums = new Array(totalWeeks).fill(0);
                    
                        Object.keys(ordersData).forEach((orderId) => {
                            const order = ordersData[orderId];
                            const requestData = order.request_data;
                            const orderTimestamp = requestData.timestamp;
                    
                            if (isWithinRange(orderTimestamp, startDate.getTime(), endDate.getTime()) && requestData.status === 'Оплачен') {
                                const year = parseInt(orderTimestamp.substring(0, 4));
                                const month = parseInt(orderTimestamp.substring(4, 6)) - 1; 
                                const day = parseInt(orderTimestamp.substring(6, 8));
                    
                                const tsDate = new Date(year, month, day);
                                const dayIndex = Math.floor((tsDate - startDate) / (1000 * 60 * 60 * 24));
                                const weekIndex = Math.floor(dayIndex / 7);
                                                
                                weeklySums[weekIndex] += requestData.price;
                            }
                        });
                    
                        let weeklyData = {};
                        for (let week = 1; week <= totalWeeks; week++) {
                            weeklyData[`Week ${week}`] = weeklySums[week - 1];
                        }
                    
                        intervals[selectedInterval] = weeklyData;
                        break;    
                    case 'year':
                        const yearSales = {};
                    
                        Object.keys(ordersData).forEach((orderId) => {
                            const order = ordersData[orderId];
                            const requestData = order.request_data;
                            const orderTimestamp = requestData.timestamp;
                    
                            if (
                                isWithinRange(orderTimestamp, startDate.getTime(), endDate.getTime()) &&
                                requestData.status === 'Оплачен'
                            ) {
                                const year = parseInt(orderTimestamp.substring(0, 4), 10);
                                const month = parseInt(orderTimestamp.substring(4, 6), 10);
                                const yearMonthKey = `${year}-${month < 10 ? '0' : ''}${month}`;
                    
                                if (!yearSales[yearMonthKey]) {
                                    yearSales[yearMonthKey] = 0;
                                }
                    
                                yearSales[yearMonthKey] += requestData.price;
                            }
                        });

                        const currentDate = new Date(startDate);
                        while (currentDate <= endDate) {
                            const year = currentDate.getFullYear();
                            const month = currentDate.getMonth() + 1;
                            const yearMonthKey = `${year}-${month < 10 ? '0' : ''}${month}`;
                    
                            if (!yearSales[yearMonthKey]) {
                                yearSales[yearMonthKey] = 0;
                            }
                    
                            currentDate.setMonth(currentDate.getMonth() + 1);
                        }
                    
                        intervals[selectedInterval] = yearSales;
                        break;     
                }
            }
        });
        const intervalData = { [selectedInterval]: intervals[selectedInterval] };
        drawBarChart(intervalData); 
        return intervalData;
        
    }



    function calculateIntervalDataForTopsChart(ordersData, startDate, endDate) {
        const intervals = {
            day: {},
            week: {},
            month: {},
            year: {}
        };
    
        let selectedInterval;
        const diffInDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
        if (diffInDays <= 1) {
            selectedInterval = 'day';
        } else if (diffInDays <= 7) {
            selectedInterval = 'week';
        } else if (diffInDays <= 31) {
            selectedInterval = 'month';
        } else {
            selectedInterval = 'year';
        }
    
        const salesData = {};
    
        Object.keys(ordersData).forEach((orderId) => {
            const order = ordersData[orderId];
            const requestData = order.request_data;
            const orderTimestamp = requestData.timestamp;
    
            if (
                isWithinRange(orderTimestamp, startDate.getTime(), endDate.getTime()) &&
                requestData.status === 'Оплачен'
            ) {
                const productName = requestData.name;
                const price = requestData.price || 0;
    
                if (!salesData[productName]) {
                    salesData[productName] = {
                        count: 0,
                        totalPrice: 0
                    };
                }
    
                salesData[productName].count++;
                salesData[productName].totalPrice += price;
            }
        });
    
       
        const sortedSales = Object.entries(salesData)
            .map(([productName, { count, totalPrice }]) => ({ productName, count, totalPrice }))
            .sort((a, b) => b.count - a.count);

            
        intervals[selectedInterval] = sortedSales;
        const intervalData = intervals[selectedInterval];

    
        
        drawDoughnutChart(intervalData);
        return intervalData;

        
    }
    

    


    

    function drawBarChart(intervalData) {
        const selectedInterval = Object.keys(intervalData)[0];
        const data = intervalData[selectedInterval];
    
        const ctx = document.getElementById('salesBarChart').getContext('2d');
    
        const labels = Object.keys(data);
        const salesData = Object.values(data);
        const colors = generateRandomColors(labels.length);
    
        const datasets = [];
    
        datasets.push({
            label: 'Сумма',
            data: salesData.map(value => (value !== 0) ? value : null),
            backgroundColor: colors,
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        });
    
        if (salesChart) {
            salesChart.destroy();
        }
    
        salesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    

        const totalSalesSum = salesData.reduce((acc, curr) => acc + curr, 0);
        const salesSumElement = document.querySelector('.sales-sum');
        salesSumElement.textContent = `${totalSalesSum} ₸`;
    }
    


    function drawPieChart(data) {
        const chartData = {
            labels: ['Оплачен', 'Не оплачен'],
            datasets: [{
                data: [data.paid.count, data.unpaid.count],
                backgroundColor: ['#02C56C', '#FF5944']
            }]
        };
    
        const ctx = document.getElementById('statusChart').getContext('2d');
        if (myPieChart) {
            myPieChart.destroy();
        }
    
        myPieChart = new Chart(ctx, {
            type: 'pie',
            data: chartData,
            options: {
                tooltips: {
                    callbacks: {
                        label: function (tooltipItem, chartData) {
                            const label = chartData.labels[tooltipItem.index];
                            const currentValue = chartData.datasets[0].data[tooltipItem.index];
    
                            if (label === 'Оплачен') {
                                return `Оплачено: ${currentValue} заказов на сумму ${data.paid.totalAmount}`;
                            } else {
                                return `Не оплачено: ${currentValue} заказов на сумму ${data.unpaid.totalAmount}`;
                            }
                        }
                    }
                }
            }
        });
    }


    function drawDoughnutChart(salesData) {
        const labels = [];
        const data = [];
        const backgroundColors = [];
    
        salesData.forEach((item) => {
            labels.push(item.productName);
            data.push(item.count);
            backgroundColors.push(generateRandomColors(labels.length));
        });
    
        const chartData = {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        };
    
        const ctx = document.getElementById('salesDoughnutChart').getContext('2d');
        if (myDoughnutChart) {
            myDoughnutChart.destroy();
        }
    
        myDoughnutChart = new Chart(ctx, {
            type: 'doughnut',
            data: chartData
        });
    }
    
    
    function generateRandomColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const color = `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 0.5)`;
            colors.push(color);
        }
        return colors;
    }



    
    
    
    function isWithinRange(timestamp, startDate, endDate) {
        const ts = parseInt(timestamp, 10); 
        const tsDate = new Date(
            ts.toString().replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6')
        );
    
        return tsDate >= startDate && tsDate <= endDate;
    }


    authenticateUser();
    

});
