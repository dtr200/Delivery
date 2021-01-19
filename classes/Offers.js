class Offers extends City{
    constructor(){
        super();
        this.images = '';
        this.companies = '';
        this.moscow = '';
		this.currentCity = '';
		this.localPriceContainer = '';
		this.sortByPriceButton = '';
		this.sortBySpeedButton = '';
		this.usedOffers = [];
		this.toCountry = '';
		this.toCity = '';
		this.toRegion = '';
    }

    /** Проверяю localStorage на наличие delivery */

	checkDelivery() {
		// если есть
		if (localStorage[`delivery${location.pathname}`]) {			
			let parsedDelivery = JSON.parse(localStorage[`delivery${location.pathname}`]);
			this.currentCity = localStorage.userCity || localStorage.cities;
			this.currentCity = JSON.parse(this.currentCity);
			if(parsedDelivery.errors){ 
				const txt = 'Ошибка получения цен';
				super.createPlaces(null, this.localPriceContainer, txt);
				localStorage.removeItem(`delivery${location.pathname}`)
			}else{
				parsedDelivery.city[0] == this.currentCity[0][0] && parsedDelivery.city[1] == this.currentCity[0][1] ?
				this.pasteDelivery() : this.pickupFromStorage();
			}			
		}
		else {
			// если нет
			this.pickupFromStorage();
		}
	}


	/** Запрос на получения цены и сроков доставки */

	pickupFromStorage(){
		this.toCountry = localStorage.country == "Россия" ? 'RU' :
			localStorage.country == "Беларусь" ? 'BY' :
				localStorage.country == "Казахстан" ? 'KZ' : false;
		this.toCity = localStorage.userCity || localStorage.cities;
		if(!this.toCity) {
			const interval = setInterval(() => {
				this.toCity = localStorage.userCity || localStorage.cities;
				if(this.toCity){
					clearInterval(interval);
					this.getDeliveryPrices();
				}
			}, 50);			
		}
		else
			this.getDeliveryPrices();
	}
	
	getDeliveryPrices() {
		this.toCity = JSON.parse(this.toCity);
		this.currentCity = this.toCity;

		if (this.toCity[0].length == 2) {
			this.toCity = this.toCity[0][1];
			this.toRegion = '';
		}
		else {
			this.toRegion = this.toCity[0][1];
			this.toCity = this.toCity[0][2];
		};

		let fromCountry = 'RU',
			fromCity = 'Москва',
			fromRegion = '',
			weight = /* document.querySelector('.cls').textContent || */ '140',
			volume = /* document.querySelector('.cls').textContent || */ '1',
			pickup = 0,
			deliver = 0,
			insurance = 0;

		let url = `https://capi.sbl.su/calc/place?from-country=${fromCountry}&from-city=${fromCity}&from-area=${fromRegion}&to-country=${this.toCountry}&to-city=${this.toCity}&to-area=${this.toRegion}&hsw[]=0&weights[]=${weight}&volumes[]=${volume}&quantities[]=1&palletize[]=0&lathing[]=0&need-pickup=${pickup}&need-deliver=${deliver}&widget=dostavka&palletize[]=0&need-insuring=${insurance}&cargo-price=0&need-labeling=0`,
			req = new XMLHttpRequest();

		req.onload = () => {
				const resp = JSON.parse(req.response);
				this.parseDelivery(resp);
		}
		req.open('GET', url, true);
		req.setRequestHeader('Accept', 'application/json, text/javascript');
		req.send();
	}

	/** Распарсиваю и сохраняю в локалсторедже  */

	parseDelivery(resp) {
		if (resp.result) {
			let city;
			localStorage.userCity ? city = JSON.parse(localStorage.userCity) :
				localStorage.cities ? city = JSON.parse(localStorage.cities) : false
			resp.city = city[0];
			localStorage.setItem(`delivery${location.pathname}`, JSON.stringify(resp));
		}
		else {
			const info = {
				'errors': {
					"tarif": ["Ничего не найдено"]
				}
			};
			localStorage.setItem(`delivery${location.pathname}`, JSON.stringify(info));
		};
		this.pasteDelivery();
	}

	/** Создаю и ставлю все офферы */

	pasteDelivery(insert) {
		const data = insert || JSON.parse(localStorage[`delivery${location.pathname}`]);
		if (data.result) {
			this.localPriceContainer.innerHTML = '';
			let updData = this.isMoscow(data.result);
			updData.forEach((el, i) => {				
				// проверяю на повторения
				if(this.usedOffers.includes(this.companies[el.company_name])) return;
				const company = el.company_name,
					price = el.total,
					time = el.period,
					offer = this.createOffer(company, price, time, i);
				this.localPriceContainer.append(offer);
			});
			// привязал текущий контекст для ивентлистенера на кнопках сортировки
			const sortByPrice = this.sortByPrice.bind(this),
				sortBySpeed = this.sortBySpeed.bind(this);
			this.sortByPriceButton.addEventListener('click', sortByPrice);
			this.sortBySpeedButton.addEventListener('click', sortBySpeed);
		} else {
			this.localPriceContainer.innerHTML = `<span class="delivery-widget-offers-scaning">Ничего не найдено</span>`
		}
		this.usedOffers = [];
	}

	/** Добавляю оффер для Москвы и области */

	isMoscow(data) {
		const check = this.moscow.includes(this.currentCity[0][1]);
		// город мос области пришел с sbl.su || город выбран в модальном окне
		if (this.currentCity[0][1] == 'Московская обл.' && this.currentCity[0][2] != 'Москва' || check && this.currentCity[0][2] != 'Москва')
			return this.createLocal(data, 'МО', 1000, 1);
		else if (this.currentCity[0][1] == 'Москва' || this.currentCity[0][2] == 'Москва')
			return this.createLocal(data, 'Москве', 500, 1);
		else return data
	}

	/** Создаю местную доставку и ставлю ее в начало массива всех доставок */

	createLocal(data, place, price, period) {
		const local = {
			'company_name': `Наша доставка по ${place}`,
			'total': price,
			'period': period
		};
		data.unshift(local);
		return data
	}

	/** Непосредственно создание оффера */

	createOffer(company, price, time, num) {
		const mainContainer = document.createElement('div'),
			logoContainer = document.createElement('div'),
			textContainer = document.createElement('div'),
			priceBlock = document.createElement('span'),
			timeBlock = document.createElement('span'),
			img = this.images[company],
			title = document.createElement('span');
		let logo;

		if (img) {
			logo = document.createElement('img');
			logo.setAttribute('src', img);
			logo.classList.add('delivery-widget-logo');
		}
		// добавляю отработанные ТК для исключения повторений в будущем
		this.usedOffers.push(this.companies[company]);
		// дальше формирую оффер...
		let lowerTitle = this.companies[company].toLowerCase();
		lowerTitle = lowerTitle[0].toUpperCase() + lowerTitle.slice(1);
		company == 'Наша доставка по Москве' || company == 'Наша доставка по МО' ? title.textContent = company :
			title.textContent = `ТК ${lowerTitle}`;
		title.classList.add('delivery-widget-offer-title');
		timeBlock.classList.add('delivery-widget-text-time');
		priceBlock.classList.add('delivery-widget-text-price');
		textContainer.classList.add('delivery-widget-text-content');
		logoContainer.classList.add('delivery-widget-logo-container');
		mainContainer.classList.add(`delivery-widget-offer`, `delivery-widget-offer-${num + 1}`);
		time != -1 ? timeBlock.textContent = `${time} дн.` : timeBlock.textContent = `н.д.`;
		priceBlock.textContent = `${price} руб.`;
		textContainer.append(priceBlock, timeBlock);
		logo ? logoContainer.append(title, logo) : logoContainer.append(title);
		mainContainer.append(logoContainer, textContainer);
		return mainContainer;
    }
	
	/** Сортировки */

	sortByPrice(){
		this.sortBy('total');
	}

	sortBySpeed(){
		this.sortBy('period');
	}

	sortBy(condition){
		let data = JSON.parse(localStorage[`delivery${location.pathname}`]);
		// собрал компании с неизвестным сроком доставки
		const filtred = data.result.filter(el => el.period == -1);
		// ищу в массиве ТК которые есть в filtred и удаляю их
		filtred.forEach(el => {
			for(let j = 0; j < data.result.length; j++){
				if(el.company_name == data.result[j].company_name)
					data.result.splice(j, 1);
			}
		});
		// сортирую массив ТК с известными сроками доставки
		const sortedArray = data.result.sort((a, b) => a[condition] - b[condition]);
		// добавляю неизвестные
		const united = sortedArray.concat(filtred);
		const sorted = {'result': united};
		this.pasteDelivery(sorted);
	}

    render(data) {
		Object.keys(data).forEach(el => this[el] = data[el]);
		this.localPriceContainer = document.querySelector(this.localPriceContainer);
		this.sortByPriceButton = document.querySelector(this.sortByPriceButton);
		this.sortBySpeedButton = document.querySelector(this.sortBySpeedButton);
		this.checkDelivery();
	}
}