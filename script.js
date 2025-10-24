document.addEventListener('DOMContentLoaded', () => {
    const photos = document.querySelectorAll('.gallery-photo');
    const prevButton = document.querySelector('.prev');
    const nextButton = document.querySelector('.next');
    let currentIndex = 0;

    function showPhoto(index) {
        photos.forEach((photo, i) => {
            photo.classList.toggle('active', i === index);
        });
    }

    function showNextPhoto() {
        currentIndex = (currentIndex + 1) % photos.length;
        showPhoto(currentIndex);
    }

    function showPrevPhoto() {
        currentIndex = (currentIndex - 1 + photos.length) % photos.length;
        showPhoto(currentIndex);
    }

    nextButton.addEventListener('click', showNextPhoto);
    prevButton.addEventListener('click', showPrevPhoto);

    setInterval(showNextPhoto, 5000); // Automatic slideshow
});
