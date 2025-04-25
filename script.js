document.addEventListener('DOMContentLoaded', function() {
    let doctors = [];
    const searchInput = document.getElementById('search-input');
    const suggestionsContainer = document.getElementById('suggestions');
    const doctorListContainer = document.getElementById('doctor-list');
    const specialityFiltersContainer = document.getElementById('speciality-filters');
    
    // Fetch doctor data from API
    fetch('https://srijandubey.github.io/campus-api-mock/SRM-C1-25.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            doctors = data;
            initializeFilters();
            renderDoctors(doctors);
            setupEventListeners();
            applyFiltersFromURL();
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            doctorListContainer.innerHTML = '<p>Error loading doctor data. Please try again later.</p>';
        });
    
    // Initialize speciality filters
    function initializeFilters() {
        // Get all unique specialities
        const specialities = new Set();
        doctors.forEach(doctor => {
            if (doctor.speciality) {
                doctor.speciality.split(',').forEach(spec => {
                    specialities.add(spec.trim());
                });
            }
        });
        
        // Create checkboxes for each speciality
        Array.from(specialities).sort().forEach(speciality => {
            const sanitizedSpeciality = speciality.replace(/\s+/g, '-').replace(/\//g, '-');
            const checkboxId = `filter-specialty-${sanitizedSpeciality}`;
            const div = document.createElement('div');
            div.className = 'filter-option';
            div.innerHTML = `
                <input type="checkbox" id="${checkboxId}" value="${speciality}" data-testid="${checkboxId}">
                <label for="${checkboxId}">${speciality}</label>
            `;
            specialityFiltersContainer.appendChild(div);
        });
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Search input with autocomplete
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                filterDoctors();
            }
        });
        
        // Filter change events
        document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
            input.addEventListener('change', filterDoctors);
        });
        
        // Handle browser back/forward navigation
        window.addEventListener('popstate', function() {
            applyFiltersFromURL();
        });
    }
    
    // Handle search input for autocomplete
    function handleSearchInput() {
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm.length < 2) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        const matches = doctors.filter(doctor => 
            doctor.name.toLowerCase().includes(searchTerm))
            .slice(0, 3);
        
        if (matches.length > 0) {
            suggestionsContainer.innerHTML = '';
            matches.forEach(doctor => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.textContent = doctor.name;
                div.setAttribute('data-testid', 'suggestion-item');
                div.addEventListener('click', function() {
                    searchInput.value = doctor.name;
                    suggestionsContainer.style.display = 'none';
                    filterDoctors();
                });
                suggestionsContainer.appendChild(div);
            });
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
    }
    
    // Filter doctors based on current filters
    function filterDoctors() {
        let filteredDoctors = [...doctors];
        const params = new URLSearchParams();
        
        // Apply name filter
        const nameFilter = searchInput.value.trim().toLowerCase();
        if (nameFilter) {
            filteredDoctors = filteredDoctors.filter(doctor => 
                doctor.name.toLowerCase().includes(nameFilter));
            params.set('name', nameFilter);
        }
        
        // Apply speciality filter
        const selectedSpecialities = [];
        document.querySelectorAll('#speciality-filters input[type="checkbox"]:checked').forEach(checkbox => {
            selectedSpecialities.push(checkbox.value);
            params.append('speciality', checkbox.value);
        });
        
        if (selectedSpecialities.length > 0) {
            filteredDoctors = filteredDoctors.filter(doctor => {
                if (!doctor.speciality) return false;
                const doctorSpecialities = doctor.speciality.split(',').map(s => s.trim());
                return selectedSpecialities.some(spec => doctorSpecialities.includes(spec));
            });
        }
        
        // Apply consultation mode filter
        const consultationMode = document.querySelector('input[name="consultation-mode"]:checked').value;
        if (consultationMode !== 'All') {
            filteredDoctors = filteredDoctors.filter(doctor => 
                doctor.consultation_mode === consultationMode);
            params.set('consultation', consultationMode);
        }
        
        // Apply sorting
        const sortBy = document.querySelector('input[name="sort"]:checked')?.value;
        if (sortBy === 'fees') {
            filteredDoctors.sort((a, b) => (a.fee || 0) - (b.fee || 0));
            params.set('sort', 'fees');
        } else if (sortBy === 'experience') {
            filteredDoctors.sort((a, b) => (b.experience || 0) - (a.experience || 0));
            params.set('sort', 'experience');
        }
        
        // Update URL
        const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
        window.history.pushState({}, '', newUrl);
        
        // Render filtered doctors
        renderDoctors(filteredDoctors);
    }
    
    // Apply filters from URL parameters
    function applyFiltersFromURL() {
        const params = new URLSearchParams(window.location.search);
        
        // Name filter
        const name = params.get('name');
        if (name) {
            searchInput.value = name;
        }
        
        // Speciality filter
        const specialities = params.getAll('speciality');
        if (specialities.length > 0) {
            document.querySelectorAll('#speciality-filters input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = specialities.includes(checkbox.value);
            });
        }
        
        // Consultation mode filter
        const consultation = params.get('consultation');
        if (consultation) {
            document.querySelector(`input[name="consultation-mode"][value="${consultation}"]`).checked = true;
        } else {
            document.querySelector('input[name="consultation-mode"][value="All"]').checked = true;
        }
        
        // Sort filter
        const sort = params.get('sort');
        if (sort) {
            document.querySelector(`input[name="sort"][value="${sort}"]`).checked = true;
        }
        
        // Apply filters
        filterDoctors();
    }
    
    // Render doctor cards
    function renderDoctors(doctorsToRender) {
        doctorListContainer.innerHTML = '';
        
        if (doctorsToRender.length === 0) {
            doctorListContainer.innerHTML = '<p>No doctors found matching your criteria.</p>';
            return;
        }
        
        doctorsToRender.forEach(doctor => {
            const card = document.createElement('div');
            card.className = 'doctor-card';
            card.setAttribute('data-testid', 'doctor-card');
            
            const name = document.createElement('div');
            name.className = 'doctor-name';
            name.textContent = doctor.name;
            name.setAttribute('data-testid', 'doctor-name');
            
            const speciality = document.createElement('div');
            speciality.className = 'doctor-specialty';
            speciality.textContent = doctor.speciality || 'General Physician';
            speciality.setAttribute('data-testid', 'doctor-specialty');
            
            const heads = document.createElement('div');
            heads.className = 'doctor-heads';
            if (doctor.heads) {
                heads.textContent = `Heads: ${doctor.heads}`;
            }
            
            const experience = document.createElement('div');
            experience.className = 'doctor-experience';
            experience.textContent = `${doctor.experience || 'N/A'} yrs exp.`;
            experience.setAttribute('data-testid', 'doctor-experience');
            
            const clinic = document.createElement('div');
            clinic.className = 'doctor-clinic';
            if (doctor.clinic) {
                clinic.textContent = `© ${doctor.clinic}`;
            }
            
            card.appendChild(name);
            card.appendChild(speciality);
            if (doctor.heads) card.appendChild(heads);
            card.appendChild(experience);
            if (doctor.clinic) card.appendChild(clinic);
            
            doctorListContainer.appendChild(card);
        });
    }
});