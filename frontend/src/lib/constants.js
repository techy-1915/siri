export const BRAND = {
  name: "Siri Boutique",
  tagline: "Where Style Meets Perfection",
  phone: "9885507423",
  phoneFmt: "+91 98855 07423",
  email: "orders@siriboutique.in",
  city: "Hyderabad",
  address: "Plot 4-12, Kondapur Main Road, Hyderabad 500084",
  hours: "Mon–Sat · 10:30 AM – 8:30 PM",
  established: "2014",
  specialties: [
    "Designer Dresses",
    "Designer Blouses",
    "Indo-Western Models",
    "Lehengas & Gagras",
    "Crop Tops & Long Frocks",
    "Saree Pre-Pleating & Box Folding",
    "Machine Embroidery",
    "Maggam Work",
    "Boutique & Tailoring",
    "Materials in Wholesale",
  ],
};

export const COLORS = [
  { id: "wine",   name: "Deep Wine",   hex: "#6e2a3c" },
  { id: "ivory",  name: "Ivory",       hex: "#efe6d3" },
  { id: "olive",  name: "Olive",       hex: "#7a7846" },
  { id: "indigo", name: "Indigo",      hex: "#2f3a6e" },
  { id: "gold",   name: "Antique Gold",hex: "#b88a4a" },
];

export const FABRICS = [
  { id: "silk",   name: "Raw Silk",  add: 0,    desc: "Heritage weave" },
  { id: "georg",  name: "Georgette", add: -800, desc: "Drapes lightly" },
  { id: "velvet", name: "Velvet",    add: 2400, desc: "Winter favourite" },
];

export const SIZES = ["XS", "S", "M", "L", "XL"];

export const MEASUREMENT_FIELDS = [
  { id: "bust",     label: "Bust" },
  { id: "waist",    label: "Waist" },
  { id: "hip",      label: "Hip" },
  { id: "shoulder", label: "Shoulder" },
  { id: "sleeveL",  label: "Sleeve Length" },
  { id: "kurtaL",   label: "Kurta / Frock Length" },
  { id: "armhole",  label: "Armhole" },
  { id: "neckD",    label: "Neck Depth (Front)" },
  { id: "neckB",    label: "Neck Depth (Back)" },
];

export const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

export const colorById = (id) => COLORS.find((c) => c.id === id) || COLORS[0];
export const fabricById = (id) => FABRICS.find((f) => f.id === id) || FABRICS[0];
