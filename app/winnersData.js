export const winners = [
  { id: 1, name: 'Vincent',  date: '04.22.26', src: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&h=700&fit=crop' },
  { id: 2, name: 'Mittens',  date: '04.21.26', src: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=1200&h=700&fit=crop' },
  { id: 3, name: 'Luna',     date: '04.20.26', src: 'https://images.unsplash.com/photo-1570824104453-508955ab713e?w=1200&h=700&fit=crop' },
  { id: 4, name: 'Oliver',   date: '04.19.26', src: 'https://images.unsplash.com/photo-1511275539165-cc46b1ee89bf?w=1200&h=700&fit=crop' },
  { id: 5, name: 'Bella',    date: '04.18.26', src: 'https://images.unsplash.com/photo-1494256997604-768d688b1813?w=1200&h=700&fit=crop' },
  { id: 6, name: 'Max',      date: '04.17.26', src: 'https://images.unsplash.com/photo-1518791841217-8f162f1912da?w=1200&h=700&fit=crop' },
  { id: 7, name: 'Lily',     date: '04.16.26', src: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=1200&h=700&fit=crop' },
  { id: 8, name: 'Charlie',  date: '04.15.26', src: 'https://images.unsplash.com/photo-1608848461950-0fe51dfc41cb?w=1200&h=700&fit=crop' },
  { id: 9, name: 'Cleo',     date: '04.14.26', src: 'https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=1200&h=700&fit=crop' },
  { id: 10, name: 'Oscar',   date: '04.13.26', src: 'https://images.unsplash.com/photo-1555682936-9c4c42d6c1b6?w=1200&h=700&fit=crop' },
  { id: 11, name: 'Nala',    date: '04.12.26', src: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?w=1200&h=700&fit=crop' },
  { id: 12, name: 'Leo',     date: '04.11.26', src: 'https://images.unsplash.com/photo-1555431189-0fabf2667795?w=1200&h=700&fit=crop' },
  { id: 13, name: 'Mochi',   date: '04.10.26', src: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1200&h=700&fit=crop' },
  { id: 14, name: 'Simba',   date: '04.09.26', src: 'https://images.unsplash.com/photo-1507984211203-76701d7b0e33?w=1200&h=700&fit=crop' },
  { id: 15, name: 'Daisy',   date: '04.08.26', src: 'https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?w=1200&h=700&fit=crop' },
  { id: 16, name: 'Gizmo',   date: '04.07.26', src: 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=1200&h=700&fit=crop' },
  { id: 17, name: 'Whiskers',date: '04.06.26', src: 'https://images.unsplash.com/photo-1564491884-0ebfab10e8e2?w=1200&h=700&fit=crop' },
  { id: 18, name: 'Socks',   date: '04.05.26', src: 'https://images.unsplash.com/photo-1585846888147-10ec793fbf23?w=1200&h=700&fit=crop' },
  { id: 19, name: 'Pumpkin', date: '04.04.26', src: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=1200&h=700&fit=crop' },
  { id: 20, name: 'Snowball',date: '04.03.26', src: 'https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?w=1200&h=700&fit=crop' },
]

export function getWinnerById(id) {
  return winners.find(w => String(w.id) === String(id)) || null
}

export function getWinnerNeighbors(id) {
  const idx = winners.findIndex(w => String(w.id) === String(id))
  if (idx === -1) return null
  return {
    winner: winners[idx],
    prev: winners[(idx - 1 + winners.length) % winners.length],
    next: winners[(idx + 1) % winners.length],
  }
}
