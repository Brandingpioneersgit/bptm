export const EMPLOYEE_PROFILES = [
  {
    name: "Alice Smith",
    phone: "1111111111",
    department: "Web",
    testimonials: [
      {
        client: "Acme Corp",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      }
    ]
  },
  {
    name: "Bob Johnson",
    phone: "2222222222",
    department: "SEO",
    testimonials: [
      {
        client: "Beta LLC",
        url: "https://www.youtube.com/watch?v=oHg5SJYRHA0"
      },
      {
        client: "Gamma Inc",
        url: "https://www.youtube.com/watch?v=DLzxrzFCyOs"
      }
    ]
  }
];

export function getEmployeeProfile(name, phone) {
  return EMPLOYEE_PROFILES.find(
    (e) => e.name === name && e.phone === phone
  );
}
