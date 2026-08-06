import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { AchievementBadge } from '../components/AchievementBadge';

function formatPlayTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <section>
      <img
        src={`/avatars/${user.avatar}`}
        alt=""
        className="w-24 h-24 rounded-full"
      />
      <h1>{user.nickname}</h1>
      <p>⭐ {user.stars} estrellas</p>
      <p>⏱️ {formatPlayTime(user.totalPlaySeconds)} jugados</p>

      <h2>Logros</h2>
      {user.achievements.length === 0 ? (
        <p>Sin logros todavía</p>
      ) : (
        <ul className="flex gap-3">
          {user.achievements.map((a) => (
            <li key={a}>
              <AchievementBadge id={a} />
            </li>
          ))}
        </ul>
      )}

      <p>
        <Link to="/ranking" className="underline">
          Ver ranking
        </Link>
      </p>

      <p>
        <Link to="/play" className="bg-green-800 text-lg">
          Jugar
        </Link>
      </p>

      <button onClick={onLogout}>Cerrar sesión</button>
    </section>
  );
}
