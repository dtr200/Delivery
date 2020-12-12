class City{
    constructor() {
		this.ip = '';
		this.dadataToken = '';
        this.dadataURL = '';
        this.dadataCity = '';
		this.cityContainer = '';
		this.deliveryURL = '';
		this.priceContainer = '';
		this.mainCities = '';
		this.modal = '';
		this.modalBack = '';
		this.modalHead = '';
		this.modalHeadCountries = '';
		this.modalCountriesUL = '';
		this.modalHeadClose = '';
		this.modalBody = '';
		this.modalBodyLargest = '';
		this.modalLargestUL = '';
		this.modalBodyCities = '';
		this.modalCitiesUL = '';
		this.geoSection = '';
		this.geoSectionUL = '';

		this.offers = '';
	}

	/** Проверяю localStorage */

	getCity() {
		const checkMyStorage = localStorage.getItem('cities') || localStorage.getItem('userCity');
		checkMyStorage ? this.pasteCity() : this.getAndSetGeo()
	}

	/**	 Получаю город с dadata.ru	*/

	getAndSetGeo() {
		const fullURL = this.dadataURL + "?ip=" + this.ip;
		const getDelivery = this.getDelivery.bind(this);
		let req = new XMLHttpRequest();
		req.onreadystatechange = function () {
			if (req.readyState != 4 || req.status != 200) return;
			try {
				const response = JSON.parse(req.responseText);
				getDelivery(response);
			} catch (e) {
				this.cityContainer.innerHTML = `<span class='delivery-widget-route-to-cont-scaning'>Ошибка</span>`;
			}
		};
		req.open("GET", fullURL, true);
		req.setRequestHeader("Content-Type", "application/json");
		req.setRequestHeader("Authorization", "Token " + this.dadataToken);
		req.send();
	}

	/** Получаю список городов с похожим названием */

	getDelivery(data) {
		if (data.location) {
			this.dadataCity = data.location.data.city;
			const citiesListURL = 'from-group?from-city-like=',
				citiesFullURL = `${this.deliveryURL + citiesListURL + 'Александров' /* this.dadataCity */}`;

			const req = new XMLHttpRequest(),
				addCities = this.addCities.bind(this);
			req.onreadystatechange = () => {
				if (req.readyState != 4 || req.status != 200) return
				const response = JSON.parse(req.response);
				addCities(response.cities);
			}
			req.open('GET', citiesFullURL, true);
			req.setRequestHeader('Accept', 'application/json');
			req.send();
		} else
			this.getMainCities();
	}

	/** Добавляю список городов в localStorage */

	addCities(cities) {
		if (cities.length) {
			localStorage.setItem('cities', JSON.stringify(cities));
			this.pasteCity();
		}
		else
			this.getMainCities();
    }
    
    /** Ставлю город в информер */

	pasteCity() {
		let cities = localStorage.cities,
			userCity = localStorage.userCity;

		if (userCity) {
			const city = JSON.parse(userCity),
				className = 'show-main-cities',
				txt = `${city[0][1]}, ${city[0][0]}`,
				/* txtCity = `${city[0][1]}`,
				txtCountry = `${city[0][0]}`, */
				a = this.createLink(className, txt, this.showMainCities.bind(this));
				/* cityLink = this.createLink(className, txtCity, this.showMainCities.bind(this));
				countryLink = this.createLink(className, txtCountry, this.showMainCities.bind(this)); */

			this.cityContainer.innerHTML = '';
			this.cityContainer.append(a);
			/* this.cityContainer.append(cityLink);
			this.countryContainer.append(countryLink); */ // === ПРОВЕРИТЬ! Добавит this.countryContainer! Проследить где еще встречается cityContainer
			this.priceContainer.innerHTML = `<span class='delivery-widget-offers-scaning'>Ищем варианты...</span>`;
			return;
			//this.checkDelivery(); // this.checkDelivery из файла Geo.js
		}
		else if (cities) {
			cities = JSON.parse(cities);
			if (cities.length) {
				if (cities[0].length > 2) {
					const className = 'show-main-cities',
						region = cities[0][1].match(/(([Рр]еспублика|[Рр]есп[.])\s([А-Яа-я]+)(\s[^гГ.][А-Яа-я]+)?|[А-Яа-я]+\-[А-Яа-я]+\s([Рр]еспублика|[Рр]есп[.])|[А-Яа-я]+(\-[А-Яа-я]+)?\s([Аа]утономус [Оо]бласть|[оО]бласть|[кК]рай|[оО]бл[.])?)|((ХМАО|КБР))/) || cities[0][0],
						txt = `${cities[0][2]}, ${region[0] || region}`,
						a = this.createLink(className, txt, this.showMainCities.bind(this));

					this.cityContainer.innerHTML = '';
					this.cityContainer.append(a);
					this.priceContainer.innerHTML = `<span class='delivery-widget-offers-scaning'>Ищем варианты...</span>`;
				}
				return;
				//this.checkDelivery(); // this.checkDelivery из файла Geo.js
			}
		}
		else {
			this.getMainCities();
		}
	}

	/** Создает элемент и вешает event */

	createLink(className, txt, callback) {
		const a = document.createElement('a');
		a.classList.add(className);
		if (txt) {
			const span = document.createElement('span');
			span.textContent = txt;
			a.append(span);
		}
		a.addEventListener('click', callback);
		return a
	}

	/** Вывожу список основных городов */

	getMainCities(text = 'Выберите город') {
		const className = 'show-main-cities',
			txt = text,
			closeModal = this.closeModal.bind(this),
			a = this.createLink(className, txt, () => this.showMainCities(closeModal));

		this.cityContainer.innerHTML = '';
		this.cityContainer.append(a);
	}

	/** Рисует модальное окно */

	showMainCities(closeModal) {
		this.modal = document.createElement('div');
		this.modalBack = document.createElement('div');
		const container = document.querySelector('body');

		this.modal.classList.add('wm-modal');
		this.modalBack.classList.add('wm-modal-back');
		container.append(this.modalBack, this.modal);

		const head = this.createMarkup(this.modalHead, 'div', 'modal-head'),
			body = this.createMarkup(this.modalBody, 'div', 'modal-body'),
			largestCities = this.createMarkup(this.modalBodyLargest, 'div', 'modal-body-largest'),
			largestUL = this.createMarkup(this.modalLargestUL, 'ul', 'modal-body-largest-ul'),
			cities = this.createMarkup(this.modalBodyCities, 'div', 'modal-body-cities'),
			citiesUL = this.createMarkup(this.modalCitiesUL, 'ul', 'modal-body-cities-ul'),
			countries = this.createMarkup(this.modalHeadCountries, 'div', 'modal-head-countries'),
			countriesUL = this.createMarkup(this.modalCountriesUL, 'ul', 'modal-head-countries-ul'),
			close = this.createMarkup(this.modalHeadClose, 'div', 'modal-head-close'),
			closeLink = this.createLink('modal-head-close-link', null, this.closeModal.bind(this));
		let geoSection = '';

		if (localStorage.cities) {
			const cities = JSON.parse(localStorage.cities);
			geoSection = this.createMarkup(this.geoSection, 'div', 'modal-geo');
			const geoSectionUL = this.createMarkup(this.geoSectionUL, 'ul', 'modal-geo-ul');
			this.createPlaces(cities, geoSectionUL, null, 'modal-geo-inner');
			geoSection.append(geoSectionUL);
		}

		this.createPlaces(this.mainCities, countriesUL, 'country', 'modal-country');
		this.createPlaces(this.mainCities[0].largestCities, largestUL, null, 'modal-largest-cities');
		this.createPlaces(this.mainCities[0].cities, citiesUL, null, 'modal-cities');
		close.append(closeLink);
		countries.append(countriesUL);
		countries.addEventListener('click', this.createCities.bind(this));
		localStorage.setItem('country', 'Россия');
		head.append(countries, close);
		largestCities.append(largestUL);
		cities.append(citiesUL);
		body.append(largestCities, cities);
		body.addEventListener('click', this.cityClickHandler.bind(this));
		if (geoSection)
			geoSection.addEventListener('click', this.cityClickHandler.bind(this));
		this.modal.append(head, geoSection, body);
		this.modalBack.addEventListener('click', this.closeModal.bind(this));
	}

	/** Создает div */

	createMarkup(elem, type, className) {
		elem = document.createElement(type);
		elem.classList.add(className);
		return elem
	}

	/** Удаляет модал */

	closeModal() {
		this.modal.parentNode.removeChild(this.modal);
		this.modalBack.parentNode.removeChild(this.modalBack);
	}

	/** Добавляет города/страны */

	createPlaces(source, container, content, className) {
		if(!source) container.innerHTML = content;
		else{
			container.innerHTML = '';
			source.forEach((el, i) => {
				const txt = document.createElement('li');
				txt.classList.add(`${className}-${i + 1}`);
				if (Array.isArray(el)) {
					const country = el[0];
					country == 'RU' ? country == 'Россия' :
						country == 'BY' ? country == 'Беларусь' :
							country == 'KZ' ? country == 'Казахстан' : false;
	
					const region = el[1].match(/(([Рр]еспублика|[Рр]есп[.])\s([А-Яа-я]+)(\s[^гГ.][А-Яа-я]+)?|[А-Яа-я]+\-[А-Яа-я]+\s([Рр]еспублика|[Рр]есп[.])|[А-Яа-я]+(\-[А-Яа-я]+)?\s([Аа]утономус [Оо]бласть|[оО]бласть|[кК]рай|[оО]бл[.])?)|((ХМАО|КБР))/) || country;
	
					txt.innerHTML = `<span>${el[2]}</span><span>${region[0]}</span>`;
					container.append(txt);
					return
				}
				content ? txt.textContent = el[content] : txt.textContent = el;
				container.append(txt);
			})
		}		
	}

	/** Определяют от какой страны города создавать */

	createCities(e) {
		const country = e.target.textContent,
			largestUL = document.querySelector('.modal-body-largest-ul'),
			citiesUL = document.querySelector('.modal-body-cities-ul');
		switch (country) {
			case 'Россия':
				this.runCreateCities(0, largestUL, citiesUL, country);
				break;
			case 'Беларусь':
				this.runCreateCities(1, largestUL, citiesUL, country);
				break;
			case 'Казахстан':
				this.runCreateCities(2, largestUL, citiesUL, country);
				break;
				dafault: this.runCreateCities(0, largestUL, citiesUL);
		}
	}

	runCreateCities(num, largestUL, citiesUL, country) {
		localStorage.setItem('country', country);
		this.createPlaces(this.mainCities[num].largestCities, largestUL, undefined, 'modal-largest-cities');
		this.createPlaces(this.mainCities[num].cities, citiesUL, undefined, 'modal-cities');
	}

	/** Обработчик клика на городах */

	cityClickHandler(e) {
		let city, region,
			storage = [],
			currentPlace = [];

		e.target.parentNode.classList.contains('modal-body-cities-ul') || e.target.parentNode.classList.contains('modal-body-largest-ul') ? (city = e.target.textContent, region = localStorage.country) :
			e.target.classList.contains('modal-geo-ul') || e.target.classList.contains('modal-body-cities-ul') || e.target.classList.contains('modal-geo') ? (city = 'Выберите город', region = '') :
				(city = e.target.parentNode.childNodes[0].textContent,
					region = e.target.parentNode.childNodes[1].textContent)

		currentPlace.push(region);
		currentPlace.push(city);
		storage.push(currentPlace);
		localStorage.setItem('userCity', JSON.stringify(storage));
		let text = ``;
		region ? text = `${city}, ${region}` : text = `${city}`
		this.getMainCities(text);
		const temp = new Offers();
		temp.render(this.offers);
		this.closeModal();
	}

	render(data) {
		Object.keys(data).forEach(el => this[el] = data[el]);
		this.ip = /* window.cfgeo.ip || window.wp.geo.ip || cf.geoplugin.ip || */ '91.195.131.101';
		this.cityContainer = document.querySelector(this.cityContainer);
		this.priceContainer = document.querySelector(this.priceContainer);
		localStorage.setItem('country', 'Россия');
		this.ip ? this.getCity() : this.getMainCities();
	}
}