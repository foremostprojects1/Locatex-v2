/** Mapping of legacy HTML files to React pages/routes. */
export const PAGES = [
  { file: 'index.html', name: 'Home', route: '/', layout: 'main', header: 'transparent' },
  { file: 'home-02.html', name: 'HomeV2', route: '/home-02', layout: 'main' },
  { file: 'home-03.html', name: 'HomeV3', route: '/home-03', layout: 'main' },
  { file: 'home-04.html', name: 'HomeV4', route: '/home-04', layout: 'main' },
  { file: 'home-05.html', name: 'HomeV5', route: '/home-05', layout: 'main', header: 'style-2' },
  { file: 'home-06.html', name: 'HomeV6', route: '/home-06', layout: 'bare', header: 'transparent' },

  { file: 'property-halfmap-grid.html', name: 'PropertyHalfmapGrid', route: '/property-halfmap-grid', layout: 'bare' },
  { file: 'property-halfmap-list.html', name: 'PropertyHalfmapList', route: '/property-halfmap-list', layout: 'bare' },
  { file: 'topmap-grid.html', name: 'TopmapGrid', route: '/topmap-grid', layout: 'main' },
  { file: 'topmap-list.html', name: 'TopmapList', route: '/topmap-list', layout: 'main' },
  { file: 'sidebar-grid.html', name: 'SidebarGrid', route: '/sidebar-grid', layout: 'main' },
  { file: 'sidebar-list.html', name: 'SidebarList', route: '/sidebar-list', layout: 'main' },

  { file: 'property-details-v1.html', name: 'PropertyDetailsV1', route: '/property-details-v1', layout: 'main' },
  { file: 'property-details-v2.html', name: 'PropertyDetailsV2', route: '/property-details-v2', layout: 'main' },
  { file: 'property-details-v3.html', name: 'PropertyDetailsV3', route: '/property-details-v3', layout: 'main' },
  { file: 'property-details-v4.html', name: 'PropertyDetailsV4', route: '/property-details-v4', layout: 'main' },

  { file: 'about-us.html', name: 'AboutUs', route: '/about-us', layout: 'main' },
  { file: 'our-service.html', name: 'OurService', route: '/our-service', layout: 'main' },
  { file: 'pricing.html', name: 'Pricing', route: '/pricing', layout: 'main' },
  { file: 'contact.html', name: 'Contact', route: '/contact', layout: 'main' },
  { file: 'faq.html', name: 'Faq', route: '/faq', layout: 'main' },
  { file: 'privacy-policy.html', name: 'PrivacyPolicy', route: '/privacy-policy', layout: 'main' },

  { file: 'blog.html', name: 'Blog', route: '/blog', layout: 'main' },
  { file: 'blog-grid.html', name: 'BlogGrid', route: '/blog-grid', layout: 'main' },
  { file: 'blog-detail.html', name: 'BlogDetail', route: '/blog-detail', layout: 'main' },

  { file: 'dashboard.html', name: 'Dashboard', route: '/dashboard', layout: 'dashboard' },
  { file: 'add-property.html', name: 'AddProperty', route: '/add-property', layout: 'dashboard' },
  { file: 'my-property.html', name: 'MyProperty', route: '/my-property', layout: 'dashboard' },
  { file: 'my-favorites.html', name: 'MyFavorites', route: '/my-favorites', layout: 'dashboard' },
  { file: 'reviews.html', name: 'Reviews', route: '/reviews', layout: 'dashboard' },
  { file: 'message.html', name: 'Message', route: '/message', layout: 'dashboard' },
  { file: 'my-profile.html', name: 'MyProfile', route: '/my-profile', layout: 'dashboard' },
];

export const ROUTE_BY_FILE = Object.fromEntries(PAGES.map((p) => [p.file, p.route]));
