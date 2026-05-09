const nav_elements = document.querySelectorAll("nav ul li");
const nav = document.querySelector("header nav");
const nav_links = document.querySelectorAll("nav ul li a");
const logo = document.getElementById("nav-logo-1");

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

window.addEventListener("scroll", () => {
	const dropdowns = document.querySelectorAll("body > .dropdown");

	if (window.scrollY > 200) {
		nav.classList.add("scrolled");
		nav_links.forEach((element) => {
			element.classList.add("scrolled");
		});
		logo.src = "./content/images/uw_grey.png";
		dropdowns.forEach((dropdown) => {
			dropdown.classList.add("scrolled");
		});
	} else {
		nav.classList.remove("scrolled");
		nav_links.forEach((element) => {
			element.classList.remove("scrolled");
		});
		logo.src = "./content/images/uw_brown.png";
		dropdowns.forEach((dropdown) => {
			dropdown.classList.remove("scrolled");
		});
	}
});
