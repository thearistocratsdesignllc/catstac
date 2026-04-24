export const cats = [
  { id: 1, src: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&h=700&fit=crop' },
  { id: 2, src: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=1200&h=700&fit=crop' },
  { id: 3, src: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=1200&h=700&fit=crop' },
  { id: 4, src: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=1200&h=700&fit=crop' },
  { id: 5, src: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=1200&h=700&fit=crop' },
  { id: 6, src: 'https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?w=1200&h=700&fit=crop' },
  { id: 7, src: 'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=1200&h=700&fit=crop' },
  { id: 8, src: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=1200&h=700&fit=crop' },
  { id: 9, src: 'https://images.unsplash.com/photo-1495360010541-f48722b35f7d?w=1200&h=700&fit=crop' },
  { id: 10, src: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=1200&h=700&fit=crop' },
  { id: 11, src: 'https://images.unsplash.com/photo-1472491235688-bdc81a63246e?w=1200&h=700&fit=crop' },
  { id: 12, src: 'https://images.unsplash.com/photo-1506755855567-92ff770e8d00?w=1200&h=700&fit=crop' },
]

export function getCatNeighbors(id) {
  const idx = cats.findIndex(c => String(c.id) === String(id))
  if (idx === -1) return null
  return {
    cat: cats[idx],
    prev: cats[(idx - 1 + cats.length) % cats.length],
    next: cats[(idx + 1) % cats.length],
  }
}
