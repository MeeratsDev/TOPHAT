const nav_elements = document.querySelectorAll("nav ul li");

nav_elements.forEach((element) => {
	element.addEventListener("mouseenter", () => {
		element.classList.add("hovered");
	});

	element.addEventListener("mouseleave", () => {
		element.classList.remove("hovered");
	});
});
