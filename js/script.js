// Find the date pickers and page elements we will update.
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.getElementById('getImagesButton');
const gallery = document.getElementById('gallery');
const photoModal = document.getElementById('photoModal');
const closeModalButton = document.getElementById('closeModalButton');
const modalImage = document.getElementById('modalImage');
const modalDate = document.getElementById('modalDate');
const modalTitle = document.getElementById('modalTitle');
const modalExplanation = document.getElementById('modalExplanation');

// NASA's public demo key is suitable for trying the app. For regular use,
// replace it with a personal key from https://api.nasa.gov/.
const nasaApiKey = 'DEMO_KEY';
const apodUrl = 'https://science.nasa.gov/wp-json/wp/v2/apod-basic';

// Set the date pickers to a recent range and keep them within APOD's date limits.
setupDateInputs(startInput, endInput);

// Load new photos when the button is clicked.
getImagesButton.addEventListener('click', getSpaceImages);

// Close the photo details window with its button or by clicking outside it.
closeModalButton.addEventListener('click', () => photoModal.close());
photoModal.addEventListener('click', (event) => {
	if (event.target === photoModal) {
		photoModal.close();
	}
});

async function getSpaceImages() {
	const startDate = startInput.value;
	const endDate = endInput.value;

	if (!startDate || !endDate || startDate > endDate) {
		showMessage('Choose a valid date range to find space photos.');
		return;
	}

	// Tell visitors that the request is in progress and prevent duplicate clicks.
	gallery.setAttribute('aria-busy', 'true');
	getImagesButton.disabled = true;
	showMessage('🔄 Loading space photos…');

	const query = new URLSearchParams({
		start_date: startDate,
		end_date: endDate,
		api_key: nasaApiKey
	});

	try {
		const response = await fetch(`${apodUrl}?${query}`);

		if (!response.ok) {
			throw new Error('NASA could not load the photos. Please try again in a moment.');
		}

		const photos = await response.json();
		showGallery(photos);
	} catch (error) {
		showMessage(`${error.message} The demo API key may also be rate-limited.`);
	} finally {
		gallery.setAttribute('aria-busy', 'false');
		getImagesButton.disabled = false;
	}
}

function showGallery(photos) {
	// APOD can return videos as well as images, so only show entries with an image URL.
	const imagePhotos = photos.filter((photo) => {
		return photo.media_type === 'image' && (photo.hdurl || photo.url);
	});

	gallery.replaceChildren();

	if (imagePhotos.length === 0) {
		showMessage('No space images were found for these dates. Try another range.');
		return;
	}

	imagePhotos.forEach((photo) => {
		const card = document.createElement('button');
		card.className = 'gallery-item';
		card.type = 'button';
		card.setAttribute('aria-label', `View ${photo.title} from ${formatDate(photo.date)}`);

		const image = document.createElement('img');
		image.src = photo.hdurl || photo.url;
		image.alt = photo.title;
		image.loading = 'lazy';

		const title = document.createElement('h2');
		title.textContent = photo.title;

		const date = document.createElement('p');
		date.className = 'gallery-date';
		date.textContent = formatDate(photo.date);

		card.append(image, title, date);
		card.addEventListener('click', () => openPhotoModal(photo));
		gallery.append(card);
	});
}

function openPhotoModal(photo) {
	modalImage.src = photo.hdurl || photo.url;
	modalImage.alt = photo.title;
	modalDate.textContent = formatDate(photo.date);
	modalTitle.textContent = photo.title;
	modalExplanation.textContent = photo.explanation;
	photoModal.showModal();
}

function formatDate(date) {
	// Add a time so the date is read in the visitor's local time zone as written.
	return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

function showMessage(message) {
	const placeholder = document.createElement('div');
	placeholder.className = 'placeholder';

	const text = document.createElement('p');
	text.textContent = message;
	placeholder.append(text);
	gallery.replaceChildren(placeholder);
}
