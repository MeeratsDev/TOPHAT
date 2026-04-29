const nav_elements = document.querySelectorAll("nav ul li");

nav_elements.forEach((element) => {
	element.addEventListener("mouseenter", () => {
		element.classList.add("hovered");
	});

	element.addEventListener("mouseleave", () => {
		element.classList.remove("hovered");
	});
});

nav_elements.forEach((li) => {
	const dropdown = li.querySelector(".dropdown");
	if (!dropdown) return;

	document.body.appendChild(dropdown);

	const showDropdown = () => {
		const rect = li.getBoundingClientRect();
		dropdown.style.top = `${rect.bottom + 8}px`; // 8px gap bridge
		dropdown.style.left = `${rect.left + rect.width / 2}px`;
		dropdown.classList.add("active");
	};

	const hideDropdown = () => {
		dropdown.classList.remove("active");
	};

	li.addEventListener("mouseenter", showDropdown);
	li.addEventListener("mouseleave", hideDropdown);
	dropdown.addEventListener("mouseenter", showDropdown);
	dropdown.addEventListener("mouseleave", hideDropdown);
});
