document.addEventListener('DOMContentLoaded', () => {
    const bookContainer = document.querySelector('.book-container');
    const book = document.getElementById('book');
    const pages = document.querySelectorAll('.page');
    let isDragging = false;
    let startX, startY, rotX = -20, rotY = 0;

    // Set initial rotation
    bookContainer.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

    // Mouse events for spinning the book
    bookContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        bookContainer.style.cursor = 'grabbing';
        bookContainer.style.transition = 'none'; // Disable transition during drag
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        rotY += dx * 0.5;
        rotX -= dy * 0.5;
        rotX = Math.max(-85, Math.min(85, rotX)); // Clamp rotation to avoid flipping over
        bookContainer.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            bookContainer.style.cursor = 'grab';
            bookContainer.style.transition = 'transform 0.5s'; // Re-enable transition
        }
    });

    // Touch events for spinning the book
    bookContainer.addEventListener('touchstart', (e) => {
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        bookContainer.style.transition = 'none';
    });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        rotY += dx * 0.5;
        rotX -= dy * 0.5;
        rotX = Math.max(-85, Math.min(85, rotX));
        bookContainer.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    });

    document.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            bookContainer.style.transition = 'transform 0.5s';
        }
    });

    // Flipping pages
    let currentPage = 0;
    pages.forEach((page, index) => {
        page.style.zIndex = pages.length - index;
        page.addEventListener('click', (e) => {
            // Prevent page flip while dragging
            if (isDragging) return;

            // Clicking the right half of the book flips forward, left half flips back
            const rect = bookContainer.getBoundingClientRect();
            const clickX = e.clientX - rect.left;

            if (clickX > rect.width / 2) { // Click on right side
                if (currentPage < pages.length - 1) {
                    if (currentPage === 0) {
                        pages[0].classList.add('flipped');
                        book.style.transform = 'rotateY(-180deg)';
                    } else {
                        pages[currentPage].classList.add('flipped');
                    }
                    currentPage++;
                }
            } else { // Click on left side
                if (currentPage > 0) {
                    currentPage--;
                    if (currentPage === 0) {
                        pages[0].classList.remove('flipped');
                        book.style.transform = 'rotateY(0deg)';
                    } else {
                        pages[currentPage].classList.remove('flipped');
                    }
                }
            }
        });
    });
});

