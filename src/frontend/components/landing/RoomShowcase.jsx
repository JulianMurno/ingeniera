import { iconRegistry } from './icons';

export default function RoomShowcase({ content }) {
  return (
    <section className="ml-section" id="habitaciones" aria-labelledby="rooms-title">
      <div className="ml-section-inner">
        <div className="ml-section-head">
          <h2 className="ml-section-title" id="rooms-title">
            {content.rooms.title}
          </h2>
          <p className="ml-section-intro">{content.rooms.intro}</p>
        </div>

        <div className="ml-rooms">
          {content.rooms.items.map((room) => {
            const Icon = iconRegistry[room.icon];
            return (
              <article
                className={`ml-room${room.feature ? ' ml-room--feature' : ''}`}
                key={room.name}
              >
                <div className={`ml-room-art ml-room-art--${room.tone}`} aria-hidden="true">
                  <Icon className="ml-room-icon" />
                </div>
                <div className="ml-room-body">
                  <p className="ml-room-type">{room.type}</p>
                  <h3>{room.name}</h3>
                  <p>{room.text}</p>
                  <ul className="ml-room-meta">
                    {room.meta.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
