// --- Classes e Constantes Globais ---
class DeviceDetector {
    constructor() {
        this.deviceType = this.detectDeviceType();
        this.applyDeviceClass();
    }
    detectDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile';
        return 'desktop';
    }
    applyDeviceClass() {
        document.body.classList.add(`device-${this.deviceType}`);
    }
}

const lightModeLogoUrl = "https://saymonaraujo.dev/2.png";
const darkModeLogoUrl = "https://saymonaraujo.dev/3.png";
const lightModeSplineUrl = "https://prod.spline.design/tkWnkGhsdwfGSOvI/scene.splinecode";
const darkModeSplineUrl = "https://prod.spline.design/V49z547cQ1XlB60r/scene.splinecode"; // <-- URL ATUALIZADA
const splineViewerId = 'spline-viewer-main';

// --- Funções Utilitárias ---
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// --- Performance Metrics ---
function reportPerformanceMetrics() {
    if ('performance' in window && 'PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                console.log(`[Performance] ${entry.name}: ${entry.startTime.toFixed(0)}ms`);
            });
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    }
}

// --- Lógica Principal ---
document.addEventListener('DOMContentLoaded', () => {

    // --- Cache de elementos DOM ---
    const elements = {
        body: document.body,
        header: document.querySelector('header'),
        themeToggleButton: document.getElementById('theme-toggle-button'),
        logoImage: document.getElementById('logo-image'),
        hamburgerButton: document.getElementById('hamburger-button'),
        navLinksContainer: document.getElementById('main-nav-links'),
        contactForm: document.querySelector('.contact-form'),
        nameInput: document.getElementById('name'),
        emailInput: document.getElementById('email'),
        messageInput: document.getElementById('message'),
        backToTopButton: document.getElementById('back-to-top-button'),
        footerAboutLink: document.getElementById('footer-about-link'),
        footerAboutLinkMobile: document.getElementById('footer-about-link-mobile'), // Adicionado para o link mobile
        navAboutLink: document.getElementById('nav-about-link'), // Nota: Este elemento não deve existir se removido da navegação principal
        mainNavLinks: document.querySelectorAll('.main-nav-link'), // Seleciona apenas o link do logo agora
        languageDropdown: document.querySelector('.language-dropdown'),
        currentLanguageEl: document.getElementById('current-language'),
        splineContainer: document.getElementById(splineViewerId)?.parentNode,
        heroSection: document.getElementById('home')
    };

    // --- Inicialização ---
    function initDeviceDetector() {
        new DeviceDetector();
    }

    // --- Tema e Spline ---
    function applyTheme(isDarkMode) {
        if (elements.logoImage) {
            elements.logoImage.src = isDarkMode ? darkModeLogoUrl : lightModeLogoUrl;
        }
        elements.body.classList.toggle('dark-mode', isDarkMode);
    }

    function replaceSplineViewer(targetUrl) {
        let currentViewer = document.getElementById(splineViewerId);
        if (!elements.splineContainer) { console.error("Container do Spline não encontrado."); return; }
        if (!currentViewer) {
             // If it doesn't exist (e.g., on mobile initially), create it
             currentViewer = document.createElement('spline-viewer');
             currentViewer.id = splineViewerId;
             currentViewer.className = 'optimize-animation';
             elements.splineContainer.appendChild(currentViewer);
        }
        // Create a new viewer element
        const newSplineViewer = document.createElement('spline-viewer');
        newSplineViewer.setAttribute('id', splineViewerId);
        newSplineViewer.setAttribute('url', targetUrl);
        newSplineViewer.className = currentViewer.className; // Keep classes

        // Replace the old one with the new one
        elements.splineContainer.replaceChild(newSplineViewer, currentViewer);
    }


    function updateSplineUrl(splineElement, isInitialLoad = false) {
        if (!splineElement) return;
        const isDark = elements.body.classList.contains('dark-mode');
        const targetUrl = isDark ? darkModeSplineUrl : lightModeSplineUrl;

        if (isInitialLoad) {
            splineElement.setAttribute('url', targetUrl);
        } else {
            // Only replace if the URL actually needs changing
            if (splineElement.getAttribute('url') !== targetUrl) {
                replaceSplineViewer(targetUrl);
            }
        }
    }

    // Versão otimizada da função initThemeAndSplineLazyLoad
    function initThemeAndSplineLazyLoad() {
        let savedTheme = null;
        try {
            savedTheme = localStorage.getItem('theme');
        } catch (e) {
            console.warn("LocalStorage não está acessível:", e);
            // O tema será definido com base na preferência do sistema ou padrão
        }
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialIsDark = savedTheme ? (savedTheme === 'dark') : prefersDark;
        applyTheme(initialIsDark);

        // Intersection Observer com opções otimizadas
        const splineObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const splineElement = document.getElementById(splineViewerId);
                    if (splineElement && !splineElement.hasAttribute('url') && !document.body.classList.contains('device-mobile')) {
                        // Usar requestIdleCallback para carregar durante tempo ocioso
                        if ('requestIdleCallback' in window) {
                            requestIdleCallback(() => {
                                updateSplineUrl(splineElement, true);
                            }, { timeout: 2000 });
                        } else {
                            // Fallback para browsers que não suportam requestIdleCallback
                            setTimeout(() => {
                                updateSplineUrl(splineElement, true);
                            }, 100);
                        }
                    }
                    observer.unobserve(entry.target);
                }
            });
        }, { 
            threshold: 0.1, 
            rootMargin: '150px',
        });

        if (elements.heroSection) {
            splineObserver.observe(elements.heroSection);
        }

        if (elements.themeToggleButton) {
            elements.themeToggleButton.addEventListener('click', () => {
                const isDarkModeNow = !elements.body.classList.contains('dark-mode');
                applyTheme(isDarkModeNow);
                localStorage.setItem('theme', isDarkModeNow ? 'dark' : 'light');

                const splineElement = document.getElementById(splineViewerId);
                if (splineElement?.hasAttribute('url') && !document.body.classList.contains('device-mobile')) {
                    // Usar requestAnimationFrame para sincronizar com o próximo frame
                    requestAnimationFrame(() => {
                        updateSplineUrl(splineElement, false);
                    });
                }
            });
        }
    }

    // --- Menu Hamburger ---
    function initHamburgerMenu() {
        if (elements.hamburgerButton && elements.navLinksContainer) {
             elements.hamburgerButton.addEventListener('click', () => {
                 const isActive = elements.navLinksContainer.classList.toggle('active');
                 elements.hamburgerButton.setAttribute('aria-expanded', isActive);
                 elements.hamburgerButton.textContent = isActive ? '✕' : '☰'; // Toggle icon
                 elements.body.style.overflow = isActive ? 'hidden' : ''; // Prevent body scroll when menu is open
             });

             // Close menu when a link inside it is clicked
             elements.navLinksContainer.querySelectorAll('a').forEach(link => {
                 link.addEventListener('click', (event) => {
                     // Only close if the mobile menu is currently active
                     if (elements.navLinksContainer.classList.contains('active')) {
                         elements.navLinksContainer.classList.remove('active');
                         elements.hamburgerButton.textContent = '☰'; // Reset icon
                         elements.hamburgerButton.setAttribute('aria-expanded', 'false');
                         elements.body.style.overflow = ''; // Restore body scroll
                     }
                     // Smooth scroll for hash links will be handled by the browser or potentially GSAP later
                 });
             });
        }
    }

    // --- Validação do Formulário ---
    function initFormValidation() {
        if (elements.contactForm && elements.nameInput && elements.emailInput && elements.messageInput) {
            elements.contactForm.addEventListener('submit', function(event) {
                event.preventDefault(); // Prevent default form submission
                let isValid = true;
                let errorMessages = [];

                // Reset previous errors
                [elements.nameInput, elements.emailInput, elements.messageInput].forEach(input => input.classList.remove('error'));

                // Validate Name
                if (elements.nameInput.value.trim() === '') {
                    isValid = false;
                    errorMessages.push('Por favor, insira seu nome.');
                    elements.nameInput.classList.add('error');
                }

                // Validate Email
                const emailValue = elements.emailInput.value.trim();
                if (emailValue === '') {
                    isValid = false;
                    errorMessages.push('Por favor, insira seu email.');
                    elements.emailInput.classList.add('error');
                } else if (!validateEmail(emailValue)) {
                    isValid = false;
                    errorMessages.push('Por favor, insira um email válido.');
                    elements.emailInput.classList.add('error');
                }

                // Validate Message
                if (elements.messageInput.value.trim() === '') {
                    isValid = false;
                    errorMessages.push('Por favor, insira sua mensagem.');
                    elements.messageInput.classList.add('error');
                }

                // Handle validation result
                if (!isValid) {
                    // Optionally, display errors to the user (e.g., using an alert or a dedicated error message area)
                    alert('Erros no formulário:\n' + errorMessages.join('\n'));
                    // Focus the first field with an error
                    const firstErrorField = elements.contactForm.querySelector('.error');
                    if (firstErrorField) firstErrorField.focus();
                } else {
                    // Form is valid - Add logic to actually send the form data here
                    alert('Formulário válido! (Lógica de envio a implementar)');
                    // Optionally clear the form or show a success message
                    [elements.nameInput, elements.emailInput, elements.messageInput].forEach(input => input.classList.remove('error'));
                    // elements.contactForm.reset(); // Uncomment to clear the form after submission
                }
            });
        }
    }

    // --- Scroll Listener e Efeitos (Otimizado) ---
    function initScrollEffects() {
        let scrollTimeout;
        // Use passive listener for better scroll performance
        window.addEventListener('scroll', () => {
            // Debounce using requestAnimationFrame
            if (scrollTimeout) window.cancelAnimationFrame(scrollTimeout);

            scrollTimeout = window.requestAnimationFrame(() => {
                // Header scrolled effect
                if (elements.header) {
                    elements.header.classList.toggle('scrolled', window.scrollY > 50);
                }
                // Back to top button visibility
                if (elements.backToTopButton) {
                    const shouldShow = window.scrollY > 300;
                    elements.backToTopButton.classList.toggle('show', shouldShow);
                }
            });
        }, { passive: true });

        // Back to top button click listener
        if (elements.backToTopButton) {
            elements.backToTopButton.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    // --- Animações de Scroll (Intersection Observer for fade-in) ---
    function initIntersectionObserver() {
        const sectionsToAnimate = document.querySelectorAll('.fade-in-section');
        if (sectionsToAnimate.length > 0) {
            const observerOptions = {
                threshold: 0.1 // Trigger when 10% of the element is visible
                // rootMargin: '0px 0px -50px 0px' // Optional: trigger slightly earlier/later
            };

            const observerCallback = (entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target); // Stop observing once animated
                    }
                });
            };

            const intersectionObserver = new IntersectionObserver(observerCallback, observerOptions);
            sectionsToAnimate.forEach(section => intersectionObserver.observe(section));
        }
    }

    // --- Lazy Loading Images (Otimizado) ---
    function initLazyLoading() {
        // Usar IntersectionObserver com opções otimizadas
        const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    if (element.tagName === 'IMG' && element.dataset.src) {
                        // Usar requestIdleCallback para carregar durante tempo ocioso
                        if ('requestIdleCallback' in window) {
                            requestIdleCallback(() => {
                                const img = new Image();
                                img.onload = () => {
                                    element.src = element.dataset.src;
                                    element.classList.add('loaded');
                                    element.classList.remove('lazy-load');
                                };
                                img.src = element.dataset.src;
                            }, { timeout: 1000 });
                        } else {
                            // Fallback para browsers que não suportam requestIdleCallback
                            element.src = element.dataset.src;
                            element.onload = () => {
                                element.classList.add('loaded');
                                element.classList.remove('lazy-load');
                            };
                        }
                    }
                    observer.unobserve(element);
                }
            });
        }, {
            rootMargin: '200px 0px', // Aumentar a margem para carregar mais cedo
            threshold: 0.01
        });

        document.querySelectorAll('img[data-src].lazy-load').forEach(img => {
            lazyLoadObserver.observe(img);
        });
    }

    // --- Troca de Conteúdo (About Us Page Simulation) ---
    function showAboutPage() {
        elements.body.classList.add('showing-about-us');
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top when switching

        // Close mobile menu if open
        if (elements.navLinksContainer && elements.navLinksContainer.classList.contains('active')) {
             elements.navLinksContainer.classList.remove('active');
             if(elements.hamburgerButton) {
                 elements.hamburgerButton.setAttribute('aria-expanded', 'false');
                 elements.hamburgerButton.textContent = '☰';
             }
             elements.body.style.overflow = ''; // Restore scroll
        }
    }

    function showMainContent() {
         elements.body.classList.remove('showing-about-us');
         // No need to scroll to top here, usually happens when clicking nav links
         // Close mobile menu if open
         if (elements.navLinksContainer && elements.navLinksContainer.classList.contains('active')) {
             elements.navLinksContainer.classList.remove('active');
             if(elements.hamburgerButton) {
                 elements.hamburgerButton.setAttribute('aria-expanded', 'false');
                 elements.hamburgerButton.textContent = '☰';
             }
             elements.body.style.overflow = ''; // Restore scroll
        }
    }

    function initAboutToggle() {
        const aboutTriggers = [];
        if (elements.footerAboutLink) {
            aboutTriggers.push(elements.footerAboutLink);
        }
        if (elements.footerAboutLinkMobile) {
            aboutTriggers.push(elements.footerAboutLinkMobile);
        }
        // elements.navAboutLink não é adicionado aqui, assumindo que foi removido do HTML da navegação principal.
        // Se o navAboutLink ainda existisse e devesse acionar a página "Sobre Nós",
        // poderia ser adicionado aqui com: if (elements.navAboutLink) aboutTriggers.push(elements.navAboutLink);

        aboutTriggers.forEach(link => {
            // O 'if (link)' dentro do forEach não é estritamente necessário aqui,
            // já que apenas adicionamos elementos existentes ao array aboutTriggers.
            // Mas mantê-lo não causa problemas.
            link.addEventListener('click', (event) => {
                event.preventDefault(); // Previne o comportamento padrão do link
                showAboutPage();
            });
        });

        // Listeners para os links da navegação principal (incluindo o logo) para voltar ao conteúdo principal
        // Esta parte do código permanece como está, pois lida com o retorno da página "Sobre Nós" para o conteúdo principal,
        // e não com o acionamento inicial da página "Sobre Nós".
        document.querySelectorAll('header nav a').forEach(link => {
            link.addEventListener('click', (event) => {
                 // Se estivermos mostrando a página "Sobre Nós"
                 if (elements.body.classList.contains('showing-about-us')) {
                      // Verifica se o link clicado é interno (começa com #) ou o logo
                     const href = link.getAttribute('href');
                     if ((href && href.startsWith('#')) || link.classList.contains('logo')) {
                          // Se for um link interno ou o logo, previne o padrão apenas para o logo
                         if (link.classList.contains('logo')) {
                             event.preventDefault();
                             window.scrollTo({ top: 0, behavior: 'smooth' }); // Rola o clique no logo para o topo
                         }
                          showMainContent(); // Volta para o conteúdo principal
                     }
                 }
            });
        });
    }

    // --- Internacionalização (i18n) ---
    const translations = {
        'pt': {
            'nav-resources': 'Recursos', 'nav-products': 'Produtos', 'nav-contact': 'Contato', /* 'about-title' removido dos links */
            'hero-title': 'Transforme seu Negócio com Inteligência Artificial',
            'hero-subtitle': 'Soluções personalizadas de IA para automatizar processos e impulsionar resultados',
            'get-it': 'Get it,<br>for your business >', 'discover-more': 'Discover more >', 'start-now': 'Iniciar Agora',
            'features-title': 'Recursos Inteligentes',
            'feature-1-title': 'Agentes Autônomos de IA', 'feature-1-desc': 'Automatize processos complexos com agentes de IA que aprendem continuamente e se ajustam às demandas do seu negócio, garantindo eficiência e escalabilidade sem intervenção manual.',
            'feature-2-title': 'Aprendizado Contínuo e Aprimoramento Constante', 'feature-2-desc': 'Nossos sistemas evoluem continuamente, impulsionados por aprendizado de máquina avançado.',
            'feature-3-title': 'Processamento de Linguagem Natural Multilíngue', 'feature-3-desc': 'Compreensão avançada de texto e conversas em diversos idiomas, otimizando a comunicação.',
            'feature-4-title': 'Integração Simplificada através de APIs Robustas', 'feature-4-desc': 'Oferecemos APIs robustas para a integração eficiente de nossos agentes de Inteligência Artificial com seus sistemas preexistentes.',
            'feature-5-title': 'Segurança de Nível Empresarial com Criptografia de Ponta a Ponta', 'feature-5-desc': 'Proteção avançada de dados para garantir a integridade e confidencialidade das suas informações.',
            'feature-6-title': 'Análise Visual em Tempo Real para Insights Acionáveis', 'feature-6-desc': 'Transforme dados complexos em visualizações claras e obtenha insights imediatos para decisões estratégicas.',
            'products-title': 'Nossas Soluções',
            'product-1-title': 'Cogni Assistant: Assistente Virtual Inteligente 24/7', 'product-1-desc': 'Automatize o atendimento ao cliente, obtenha respostas instantâneas e resolva problemas continuamente, otimizando custos operacionais em até 70%.',
            'product-2-title': 'Cogni Analyst: Insights Acionáveis a Partir de Dados Complexos', 'product-2-desc': 'Nossa ferramenta de análise transforma informações em insights valiosos, revelando tendências e oportunidades cruciais para o seu negócio.',
            'product-3-title': 'Cogni Agent: Automação Inteligente de Fluxos de Trabalho', 'product-3-desc': 'Agentes autônomos personalizados para otimizar processos específicos, tomando decisões assertivas e executando tarefas de forma independente.',
            'learn-more': 'Saiba Mais',
            'contact-title': 'Entre em Contato',
            'contact-name': 'Nome', 'contact-name-placeholder': 'Seu nome completo',
            'contact-email': 'Email', 'contact-email-placeholder': 'seu.email@empresa.com',
            'contact-company': 'Empresa', 'contact-company-placeholder': 'Nome da sua empresa',
            'contact-message': 'Mensagem', 'contact-message-placeholder': 'Como podemos ajudar?',
            'send-message': 'Enviar Mensagem',
            'contact-address': 'Endereço', 'contact-address-line1': 'Av. Paulista, 1000, 15º andar', 'contact-address-line2': 'São Paulo, SP - Brasil',
            'contact-phone': 'Telefone',
            'footer-about': 'Transformando negócios com soluções de inteligência artificial de ponta, personalizadas para as necessidades específicas de cada cliente.',
            'footer-quick-links': 'Links Rápidos', 'footer-products': 'Produtos', 'footer-support': 'Suporte',
            'footer-help-center': 'Central de Ajuda', 'footer-docs': 'Documentação', 'footer-system-status': 'Status do Sistema', 'footer-privacy': 'Política de Privacidade',
            'footer-copyright': '© 2025 Cogni IA. Todos os direitos reservados.',
            'back-to-top': 'Voltar ao topo',
            'about-title': 'Sobre Nós', // Mantido para o título da página e link do footer
            'about-mission-title': 'Missão', 'about-mission-desc': 'Nossa missão é democratizar o acesso à inteligência artificial avançada, capacitando empresas de todos os tamanhos a automatizar processos, otimizar operações e alcançar resultados extraordinários.',
            'about-vision-title': 'Visão', 'about-vision-desc': 'Ser a principal referência em soluções de IA personalizadas na América Latina, impulsionando a inovação e a transformação digital em diversos setores da economia.',
            'about-values-title': 'Valores',
            'about-value-1-title': 'Inovação:', 'about-value-1-desc': 'Buscamos constantemente novas tecnologias e abordagens para oferecer as melhores soluções.',
            'about-value-2-title': 'Excelência:', 'about-value-2-desc': 'Comprometemo-nos com a mais alta qualidade em nossos produtos e serviços.',
            'about-value-3-title': 'Parceria:', 'about-value-3-desc': 'Trabalhamos lado a lado com nossos clientes para garantir seu sucesso.',
            'about-value-4-title': 'Ética:', 'about-value-4-desc': 'Agimos com integridade e transparência em todas as nossas interações.',
            'about-value-5-title': 'Impacto:', 'about-value-5-desc': 'Focamos em gerar resultados tangíveis e positivos para nossos clientes e para a sociedade.'
        },
        'en': {
            'nav-resources': 'Features', 'nav-products': 'Products', 'nav-contact': 'Contact',
            'hero-title': 'Transform Your Business with Artificial Intelligence',
            'hero-subtitle': 'Custom AI solutions to automate processes and drive results',
            'get-it': 'Get it,<br>for your business >', 'discover-more': 'Discover more >', 'start-now': 'Get Started',
            'features-title': 'Intelligent Features',
            'feature-1-title': 'Autonomous AI Agents', 'feature-1-desc': 'Automate complex processes with AI agents that continuously learn and adapt to your business needs, ensuring efficiency and scalability without manual intervention.',
            'feature-2-title': 'Continuous Learning and Constant Improvement', 'feature-2-desc': 'Our systems continuously evolve, driven by advanced machine learning.',
            'feature-3-title': 'Multilingual Natural Language Processing', 'feature-3-desc': 'Advanced understanding of text and conversations in multiple languages, optimizing communication.',
            'feature-4-title': 'Simplified Integration through Robust APIs', 'feature-4-desc': 'We offer robust APIs for the efficient integration of our Artificial Intelligence agents with your existing systems.',
            'feature-5-title': 'Enterprise-Level Security with End-to-End Encryption', 'feature-5-desc': 'Advanced data protection to ensure the integrity and confidentiality of your information.',
            'feature-6-title': 'Real-Time Visual Analysis for Actionable Insights', 'feature-6-desc': 'Transform complex data into clear visualizations and get immediate insights for strategic decisions.',
            'products-title': 'Our Solutions',
            'product-1-title': 'Cogni Assistant: 24/7 Intelligent Virtual Assistant', 'product-1-desc': 'Automate customer service, get instant answers, and solve problems continuously, optimizing operational costs by up to 70%.',
            'product-2-title': 'Cogni Analyst: Actionable Insights from Complex Data', 'product-2-desc': 'Our analysis tool transforms information into valuable insights, revealing crucial trends and opportunities for your business.',
            'product-3-title': 'Cogni Agent: Intelligent Workflow Automation', 'product-3-desc': 'Custom autonomous agents to optimize specific processes, making assertive decisions and executing tasks independently.',
            'learn-more': 'Learn More',
            'contact-title': 'Get in Touch',
            'contact-name': 'Name', 'contact-name-placeholder': 'Your full name',
            'contact-email': 'Email', 'contact-email-placeholder': 'your.email@company.com',
            'contact-company': 'Company', 'contact-company-placeholder': 'Your company name',
            'contact-message': 'Message', 'contact-message-placeholder': 'How can we help?',
            'send-message': 'Send Message',
            'contact-address': 'Address', 'contact-address-line1': 'Av. Paulista, 1000, 15th floor', 'contact-address-line2': 'São Paulo, SP - Brazil',
            'contact-phone': 'Phone',
            'footer-about': 'Transforming businesses with cutting-edge artificial intelligence solutions, customized for each client\'s specific needs.',
            'footer-quick-links': 'Quick Links', 'footer-products': 'Products', 'footer-support': 'Support',
            'footer-help-center': 'Help Center', 'footer-docs': 'Documentation', 'footer-system-status': 'System Status', 'footer-privacy': 'Privacy Policy',
            'footer-copyright': '© 2025 Cogni IA. All rights reserved.',
            'back-to-top': 'Back to top',
             'about-title': 'About Us',
            'about-mission-title': 'Mission', 'about-mission-desc': 'Our mission is to democratize access to advanced artificial intelligence, empowering businesses of all sizes to automate processes, optimize operations, and achieve extraordinary results.',
            'about-vision-title': 'Vision', 'about-vision-desc': 'To be the leading reference in customized AI solutions in Latin America, driving innovation and digital transformation across various economic sectors.',
            'about-values-title': 'Values',
            'about-value-1-title': 'Innovation:', 'about-value-1-desc': 'We constantly seek new technologies and approaches to offer the best solutions.',
            'about-value-2-title': 'Excellence:', 'about-value-2-desc': 'We are committed to the highest quality in our products and services.',
            'about-value-3-title': 'Partnership:', 'about-value-3-desc': 'We work side-by-side with our clients to ensure their success.',
            'about-value-4-title': 'Ethics:', 'about-value-4-desc': 'We act with integrity and transparency in all our interactions.',
            'about-value-5-title': 'Impact:', 'about-value-5-desc': 'We focus on generating tangible and positive results for our clients and society.'
        },
        'es': {
            'nav-resources': 'Recursos', 'nav-products': 'Productos', 'nav-contact': 'Contacto',
            'hero-title': 'Transforme su Negocio con Inteligencia Artificial',
            'hero-subtitle': 'Soluciones de IA personalizadas para automatizar procesos e impulsar resultados',
            'get-it': 'Consíguelo,<br>para tu negocio >', 'discover-more': 'Descubre más >', 'start-now': 'Comenzar Ahora',
            'features-title': 'Recursos Inteligentes',
            'feature-1-title': 'Agentes Autónomos de IA', 'feature-1-desc': 'Automatice procesos complejos con agentes de IA que aprenden continuamente y se adaptan a las demandas de su negocio, garantizando eficiencia y escalabilidad sin intervención manual.',
            'feature-2-title': 'Aprendizaje Continuo y Mejora Constante', 'feature-2-desc': 'Nuestros sistemas evolucionan continuamente, impulsados por aprendizaje automático avanzado.',
            'feature-3-title': 'Procesamiento de Lenguaje Natural Multilíngüe', 'feature-3-desc': 'Comprensión avanzada de texto y conversaciones en diversos idiomas, optimizando la comunicación.',
            'feature-4-title': 'Integración Simplificada a través de APIs Robustas', 'feature-4-desc': 'Ofrecemos APIs robustas para la integración eficiente de nuestros agentes de Inteligencia Artificial con sus sistemas preexistentes.',
            'feature-5-title': 'Seguridad de Nivel Empresarial con Cifrado de Extremo a Extremo', 'feature-5-desc': 'Protección avanzada de datos para garantir la integridad y confidencialidad de su información.',
            'feature-6-title': 'Análisis Visual en Tiempo Real para Insights Accionables', 'feature-6-desc': 'Transforme datos complejos en visualizaciones claras y obtenga insights inmediatos para decisiones estratégicas.',
            'products-title': 'Nuestras Soluciones',
            'product-1-title': 'Cogni Assistant: Asistente Virtual Inteligente 24/7', 'product-1-desc': 'Automatice la atención al cliente, obtenga respuestas instantáneas y resuelva problemas continuamente, optimizando costos operativos hasta en un 70%.',
            'product-2-title': 'Cogni Analyst: Insights Accionables a Partir de Datos Complejos', 'product-2-desc': 'Nuestra herramienta de análisis transforma información en insights valiosos, revelando tendencias y oportunidades cruciales para su negocio.',
            'product-3-title': 'Cogni Agent: Automação Inteligente de Fluxos de Trabajo', 'product-3-desc': 'Agentes autónomos personalizados para otimizar processos específicos, tomando decisiones asertivas y ejecutando tareas de forma independiente.',
            'learn-more': 'Saber Más',
            'contact-title': 'Entre em Contato',
            'contact-name': 'Nombre', 'contact-name-placeholder': 'Su nombre completo',
            'contact-email': 'Correo Electrónico', 'contact-email-placeholder': 'su.correo@empresa.com',
            'contact-company': 'Empresa', 'contact-company-placeholder': 'Nombre de su empresa',
            'contact-message': 'Mensaje', 'contact-message-placeholder': '¿Cómo podemos ayudar?',
            'send-message': 'Enviar Mensaje',
            'contact-address': 'Dirección', 'contact-address-line1': 'Av. Paulista, 1000, 15º piso', 'contact-address-line2': 'São Paulo, SP - Brasil',
            'contact-phone': 'Teléfono',
            'footer-about': 'Transformando negocios con soluciones de inteligencia artificial de vanguardia, personalizadas para las necesidades específicas de cada cliente.',
            'footer-quick-links': 'Enlaces Rápidos', 'footer-products': 'Productos', 'footer-support': 'Soporte',
            'footer-help-center': 'Centro de Ayuda', 'footer-docs': 'Documentación', 'footer-system-status': 'Estado del Sistema', 'footer-privacy': 'Política de Privacidad',
            'footer-copyright': '© 2025 Cogni IA. Todos los derechos reservados.',
            'back-to-top': 'Volver arriba',
             'about-title': 'Sobre Nosotros',
            'about-mission-title': 'Misión', 'about-mission-desc': 'Nuestra misión es democratizar el acceso a la inteligencia artificial avanzada, capacitando a empresas de todos los tamaños para automatizar procesos, optimizar operaciones y alcanzar resultados extraordinarios.',
            'about-vision-title': 'Visión', 'about-vision-desc': 'Ser la principal referencia en soluciones de IA personalizadas en América Latina, impulsando la innovación y la transformación digital en diversos sectores de la economía.',
            'about-values-title': 'Valores',
            'about-value-1-title': 'Inovación:', 'about-value-1-desc': 'Buscamos constantemente nuevas tecnologías y enfoques para ofrecer las mejores soluciones.',
            'about-value-2-title': 'Excelência:', 'about-value-2-desc': 'Nos comprometemos con la más alta calidad en nuestros productos y servicios.',
            'about-value-3-title': 'Colaboración:', 'about-value-3-desc': 'Trabajamos codo a codo con nuestros clientes para garantizar su éxito.',
            'about-value-4-title': 'Ética:', 'about-value-4-desc': 'Actuamos con integridad y transparencia en todas nuestras interacciones.',
            'about-value-5-title': 'Impacto:', 'about-value-5-desc': 'Nos enfocamos en generar resultados tangibles y positivos para nuestros clientes y para la sociedad.'
        }
    };

    function changeLanguage(lang) {
        if (!translations[lang]) return; // Exit if language not found
        localStorage.setItem('language', lang); // Save preference
        if (elements.currentLanguageEl) elements.currentLanguageEl.textContent = lang.toUpperCase(); // Update display

        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = translations[lang]?.[key]; // Use optional chaining
            if (translation) {
                // Handle placeholders specifically
                if (el.hasAttribute('data-i18n-placeholder') || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = translation;
                }
                // Handle title attribute
                else if (el.hasAttribute('title')) {
                     el.title = translation;
                 }
                 // Handle specific elements like the send button text content
                 else if (el.dataset.i18n === 'send-message') {
                     el.textContent = translation; // Use textContent for buttons
                 }
                 // Default: update innerHTML (handles simple text and basic HTML like <br>)
                 // Avoid overwriting elements with complex children unless intended
                 else if (!el.querySelector('.button-text')) { // Example: avoid overwriting button text if wrapped in a span
                     el.innerHTML = translation;
                 }
            }
        });
        // Update aria-label for back-to-top button
        if (elements.backToTopButton && translations[lang]?.['back-to-top']) {
             elements.backToTopButton.setAttribute('aria-label', translations[lang]['back-to-top']);
        }
    }


    function initLanguageSwitcher() {
        // Use event delegation on the dropdown container for efficiency
        if (elements.languageDropdown) {
            elements.languageDropdown.addEventListener('click', (event) => {
                // Find the closest language option ancestor
                const option = event.target.closest('.language-option');
                // If an option was clicked and has a language code
                if (option && option.dataset.lang) {
                    changeLanguage(option.dataset.lang);
                    // Optionally close the dropdown here if needed
                }
            });
        } else {
             console.warn("Container do dropdown de idiomas não encontrado.");
        }

        // Apply initial language based on localStorage or default to 'pt'
        const savedLanguage = localStorage.getItem('language') || 'pt';
        changeLanguage(savedLanguage);
    }

    // --- GSAP Animations ---
    function initGsapAnimations() {
        // Check if GSAP and ScrollTrigger are loaded
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);

            // --- Entrance Animations ---
            // Header fade/slide in
            gsap.from(elements.header, { y: -50, opacity: 0, duration: 0.8, ease: 'power3.out', immediateRender: false }); // immediateRender: false prevents flash

            // Hero content fade/slide in (staggered)
             if (document.querySelector('.hero-content')) { // Check if hero content exists (for mobile)
                 gsap.from('.hero-content h1', { y: 30, opacity: 0, duration: 0.7, delay: 0.2, ease: 'power2.out' });
                 gsap.from('.hero-content p', { y: 20, opacity: 0, duration: 0.6, delay: 0.4, ease: 'power2.out' });
                 gsap.from('.hero-content .cta-button', { scale: 0.9, opacity: 0, duration: 0.5, delay: 0.6, ease: 'back.out(1.7)' });
             }

            // --- Scroll-Triggered Animations ---
            // Feature cards fade/slide up
            gsap.utils.toArray('.feature-card').forEach((card, i) => {
                 gsap.from(card, {
                     scrollTrigger: {
                         trigger: card,
                         start: 'top 85%', // Trigger when 85% of the card top hits the viewport bottom
                         toggleActions: 'play none none none' // Play animation once on enter
                     },
                     y: 50, // Start 50px down
                     opacity: 0,
                     duration: 0.6,
                     delay: i * 0.1 // Stagger animation slightly
                 });
            });

             // Product showcases slide in (alternating direction)
             const productShowcases = gsap.utils.toArray('.product-showcase');
             productShowcases.forEach((showcase, i) => {
                 gsap.from(showcase, {
                     scrollTrigger: {
                         trigger: showcase,
                         start: 'top 85%', // Adjusted start point
                         toggleActions: 'play none none none'
                     },
                     x: i % 2 === 0 ? -50 : 50, // Slide from left for even, right for odd
                     opacity: 0,
                     duration: 0.6 // Slightly longer duration for smoother effect
                 });
             });

             // Contact form scale/fade in
             if (elements.contactForm) {
                 gsap.from(elements.contactForm, {
                     scrollTrigger: {
                         trigger: elements.contactForm,
                         start: 'top 80%',
                         toggleActions: 'play none none none'
                     },
                     scale: 0.9,
                     opacity: 0,
                     duration: 0.7
                 });
             }

             // Contact info items slide/fade in
             const contactInfoItems = document.querySelectorAll('.contact-info .contact-item');
             if (contactInfoItems.length > 0) {
                  gsap.from(contactInfoItems, {
                     scrollTrigger: {
                         trigger: '.contact-info', // Trigger based on the container
                         start: 'top 80%',
                         toggleActions: 'play none none none'
                     },
                     x: 50, // Slide from right
                     opacity: 0,
                     duration: 0.6,
                     stagger: 0.15 // Stagger animation for each item
                 });
             }


             // --- Micro-interactions (Hover Effects) ---
             // CTA Buttons
             gsap.utils.toArray('.cta-button').forEach(button => {
                 gsap.set(button, { transformOrigin: "center center" }); // Set transform origin for scaling
                 button.addEventListener('mouseenter', () => gsap.to(button, { scale: 1.05, duration: 0.2, ease: 'power1.out' }));
                 button.addEventListener('mouseleave', () => gsap.to(button, { scale: 1, duration: 0.2, ease: 'power1.in' }));
             });

             // Feature Cards (Subtle lift and shadow)
             gsap.utils.toArray('.feature-card').forEach(card => {
                 gsap.set(card, { transformOrigin: "bottom center" });
                 card.addEventListener('mouseenter', () => gsap.to(card, {
                     y: -8,
                     scale: 1.02,
                     boxShadow: elements.body.classList.contains('dark-mode') ? '0 15px 30px rgba(54, 54, 219, 0.2)' : '0 15px 30px rgba(66, 66, 255, 0.2)', // Adapt shadow for dark mode
                     duration: 0.25,
                     ease: 'power1.out'
                 }));
                 card.addEventListener('mouseleave', () => gsap.to(card, {
                     y: 0,
                     scale: 1,
                     boxShadow: elements.body.classList.contains('dark-mode') ? '0 4px 15px rgba(0,0,0,0.2)' : '0 4px 15px rgba(0,0,0,0.05)', // Reset shadow
                     duration: 0.25,
                     ease: 'power1.in'
                 }));
             });

             // Social Links (Lift)
             gsap.utils.toArray('.social-link').forEach(link => {
                 gsap.set(link, { transformOrigin: "center center" });
                 link.addEventListener('mouseenter', () => gsap.to(link, { y: -3, scale: 1.1, duration: 0.2, ease: 'power1.out' }));
                 link.addEventListener('mouseleave', () => gsap.to(link, { y: 0, scale: 1, duration: 0.2, ease: 'power1.in' }));
             });


        } else {
            console.warn("GSAP ou ScrollTrigger não está definido. Algumas animações podem não funcionar.");
        }
    }

    // --- Chamada das Funções de Inicialização ---
    initDeviceDetector();             // Detect device type first
    initThemeAndSplineLazyLoad();     // Set up theme and spline loading
    initHamburgerMenu();              // Initialize mobile menu
    initLanguageSwitcher();           // Set up language switching
    initFormValidation();             // Add form validation logic
    initScrollEffects();              // Header scroll and back-to-top button
    initIntersectionObserver();       // General fade-in animations for sections
    initLazyLoading();                // Lazy load images
    initAboutToggle();                // Handle switching between main content and about page
    initGsapAnimations();             // Initialize GSAP animations *after* other setup

}); // Fim do DOMContentLoaded


// Adicione esta função ao seu arquivo script.js
function checkConnectionSpeed() {
    // Adiciona classe para reduzir animações em conexões lentas
    if (navigator.connection && 
        (navigator.connection.saveData || 
        (navigator.connection.effectiveType && 
         ['slow-2g', '2g', '3g'].includes(navigator.connection.effectiveType)))) {
        document.body.classList.add('reduce-animations');
        console.log('[Performance] Conexão lenta detectada, reduzindo animações');
    }
}

// Adicione esta chamada ao seu evento DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    reportPerformanceMetrics();
    checkConnectionSpeed();
});