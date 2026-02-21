export interface Item {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  condition: "New" | "Like New" | "Good" | "Fair";
  estimatedValue: number;
  ownerId: string;
  ownerName: string;
  availableForGamble: boolean;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  items: Item[];
  wins: number;
  totalBets: number;
}

export const categories = [
  "All",
  "Sports",
  "Clothing",
  "Electronics",
  "Accessories",
  "Outdoor",
] as const;

export const mockItems: Item[] = [
  {
    id: "1",
    name: "Vintage Road Bike",
    description: "Classic road bike in great condition. Moving to a smaller apartment.",
    imageUrl:
      "https://images.unsplash.com/photo-1625656006822-0f81e8380331?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    category: "Sports",
    condition: "Good",
    estimatedValue: 250,
    ownerId: "2",
    ownerName: "Mike Johnson",
    availableForGamble: true,
  },
  {
    id: "2",
    name: "Designer T-Shirt Collection",
    description: "Set of 5 barely worn designer shirts. Wrong size for me.",
    imageUrl:
      "https://images.unsplash.com/photo-1746216845602-336ad3a744f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    category: "Clothing",
    condition: "Like New",
    estimatedValue: 120,
    ownerId: "3",
    ownerName: "Sarah Davis",
    availableForGamble: true,
  },
  {
    id: "3",
    name: "Wireless Headphones",
    description: "Premium wireless headphones with noise cancellation.",
    imageUrl:
      "https://images.unsplash.com/photo-1583373351761-fa9e3a19c99d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    category: "Electronics",
    condition: "Good",
    estimatedValue: 180,
    ownerId: "1",
    ownerName: "You",
    availableForGamble: true,
  },
  {
    id: "4",
    name: "Professional Skateboard",
    description: "High-quality skateboard, barely used. Took up skating, not for me.",
    imageUrl:
      "https://images.unsplash.com/photo-1606459387188-f50b5af76bc8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    category: "Sports",
    condition: "Like New",
    estimatedValue: 95,
    ownerId: "4",
    ownerName: "Alex Martinez",
    availableForGamble: true,
  },
  {
    id: "5",
    name: "Vintage Watch",
    description: "Classic timepiece with leather band. Gift that I never wear.",
    imageUrl:
      "https://images.unsplash.com/photo-1706892807280-f8648dda29ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    category: "Accessories",
    condition: "New",
    estimatedValue: 200,
    ownerId: "5",
    ownerName: "Emma Wilson",
    availableForGamble: true,
  },
  {
    id: "6",
    name: "Hiking Backpack",
    description: "40L hiking backpack, excellent condition. Upgrading to larger size.",
    imageUrl:
      "https://images.unsplash.com/photo-1680039211156-66c721b87625?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    category: "Outdoor",
    condition: "Good",
    estimatedValue: 85,
    ownerId: "2",
    ownerName: "Mike Johnson",
    availableForGamble: true,
  },
  {
    id: "7",
    name: "Gaming Console",
    description: "Previous gen console with controllers. Upgraded to latest model.",
    imageUrl:
      "https://images.unsplash.com/photo-1604846887565-640d2f52d564?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    category: "Electronics",
    condition: "Good",
    estimatedValue: 300,
    ownerId: "1",
    ownerName: "You",
    availableForGamble: true,
  },
];

export const currentUser: User = {
  id: "1",
  name: "You",
  avatar: "🎰",
  items: mockItems.filter((item) => item.ownerId === "1"),
  wins: 12,
  totalBets: 35,
};
