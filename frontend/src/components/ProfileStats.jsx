export function ProfileStats({ profile, historyCount = 0 }) {
  const cards = [
    { label: "Favorite Artists", value: profile?.favoriteArtists?.length || 0 },
    { label: "Favorite Genres", value: profile?.favoriteGenres?.length || 0 },
    { label: "Liked Songs", value: profile?.likedSongs?.length || 0 },
    { label: "Recent Plays", value: historyCount },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="glass-card rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-white/60">{card.label}</p>
          <p className="mt-2 font-display text-3xl font-bold">{card.value}</p>
        </div>
      ))}
    </section>
  );
}
