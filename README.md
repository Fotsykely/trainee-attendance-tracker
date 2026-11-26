# trainee-attendance-tracker

Pointage quotidien des stagiaires d'un centre de formation : chaque jour, chacun est **présent**, **absent** ou **en retard**. L'application garde l'historique et calcule un bilan de présence par période.

Stagiaires : Rado, Soa, Nirina, Toky, Fenitra, Mialy (insérés au premier démarrage de l'API).

Construite à partir du template [next-dotnet-template](https://github.com/Fotsykely/next-dotnet-template) : **Next.js 16** (front), **ASP.NET Core / .NET 10** (API) et **MySQL 8.4**.

## Pages

| Page | URL | Rôle |
|---|---|---|
| Pointage du jour | `/` (`?date=aaaa-mm-jj`) | choisir une date (aujourd'hui par défaut), régler les 6 stagiaires, tout enregistrer en un seul envoi |
| Historique | `/history` (`?date=…`) | les pointages d'une date choisie |
| Bilan | `/summary` (`?from=…&to=…`) | par stagiaire : jours présents, en retard, absents et taux de présence sur une période |

Un menu en haut de chaque page donne accès aux trois.

## Règles métier

- **Une seule fiche par stagiaire et par jour.** Valider une date déjà pointée **met à jour** le pointage : le formulaire est prérempli avec l'état enregistré et aucune ligne n'est ajoutée. La base elle-même l'impose (index unique sur stagiaire + date).
- **Tout ou rien.** Les 6 stagiaires doivent avoir un état. Sur une date jamais pointée, rien n'est présélectionné (« présent » doit être un choix) ; si un stagiaire est oublié, l'API refuse l'envoi et le nomme (« Choisissez un état pour : Soa, Toky. »). Rien n'est enregistré dans ce cas.
- **Pas de pointage pour une date future** (refusé par l'API, et la page l'affiche sans formulaire).
- **Bilan : la date de fin ne peut pas précéder celle de début** (la période d'un seul jour est valide).
- **Taux de présence = (présents + retards) ÷ jours pointés.** Les retards comptent comme des présences. Le dénominateur est le nombre de jours pointés pour ce stagiaire, pas le nombre de jours du calendrier.
- **Sans pointage sur la période** : le stagiaire apparaît avec des zéros et un taux « — » (`null` côté API), jamais un 0 % trompeur. Un stagiaire absent tous les jours pointés a, lui, un vrai « 0,0 % ». Le taux est arrondi à une décimale (0,5 vers le haut).

## Lancer le projet

Prérequis : .NET SDK 10 (voir `global.json`), Node.js 20.9 ou plus, Docker. Trois terminaux.

**1. Base de données** (à la racine) :

```bash
cp .env.example .env        # ajustez les mots de passe et le port si besoin
docker compose up -d        # MySQL 8.4 sur le port 3308
```

**2. API** :

```bash
cd backend/Api
dotnet user-secrets set "ConnectionStrings:Default" "Server=localhost;Port=3308;Database=attendance;User=attendance;Password=change-me"
dotnet run                  # http://localhost:5080
```

Au démarrage, l'API applique les migrations puis insère les 6 stagiaires si la table est vide. Aucun pointage fictif n'est créé. La chaîne de connexion vient des *user secrets* en développement, ou de la variable d'environnement `ConnectionStrings__Default` ailleurs ; port, base, utilisateur et mot de passe doivent correspondre à votre `.env`.

**3. Front** :

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

Documentation interactive de l'API (en développement) : <http://localhost:5080/scalar>.

## Tests

```bash
cd backend && dotnet test                  # Docker doit tourner : Testcontainers lance un MySQL jetable
cd frontend && npm run lint && npm test    # ESLint, puis Vitest sur lib/
cd frontend && npm run build              # API_BASE_URL doit être définie (voir .env.local)
```

- `AttendanceSummaryCalculatorTests` : le calcul du bilan seul, sans base (retards, arrondi, `null` sans pointage, vrai 0 %).
- `AttendanceEndpointsTests` (MySQL réel, horloge figée au 15/06/2030) : pointage puis relecture, double envoi sans doublon, date future, stagiaire manquant / inconnu / répété, bilan sur une période, fin avant début, et l'erreur MySQL 1062 sur le doublon que l'API sait reconnaître.
- Vitest : dates, formats (taux « — »), lecture du formulaire de pointage, client d'API.

Les tests de l'API utilisent un vrai MySQL et non SQLite ou le fournisseur en mémoire : les migrations sont propres au fournisseur MySQL.

## Architecture

```
Navigateur ──► Next.js (:3000) ──► API ASP.NET Core (:5080) ──► MySQL (:3308)
```

Seul le serveur Next.js parle à l'API : pas de CORS, et `API_BASE_URL` n'arrive jamais dans le navigateur.

```
backend/
  Api/
    Attendance/         AttendanceSummaryCalculator : les règles du bilan, sans base de données
    Controllers/        AttendanceController, TraineesController
    Data/               AppDbContext, TraineeSeeder, détection du doublon MySQL
    Dtos/ Entities/     Trainee, AttendanceRecord, AttendanceStatus
    Migrations/
  Api.Tests/            xUnit + WebApplicationFactory + Testcontainers (MySQL) + TestClock
frontend/
  lib/api-client/       client HTTP (server-only) : attendance.ts, types.ts
  lib/                  dates, formats, lecture du formulaire
  components/           menu, formulaire de pointage, sélecteur de date, champs
  app/                  pages (/, /history, /summary) et la Server Action d'enregistrement
```

### Points d'entrée de l'API

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/trainees` | les 6 stagiaires |
| GET | `/api/attendance/{date}` | une journée : tous les stagiaires avec leur état (`null` si non pointé) et `isRecorded` |
| PUT | `/api/attendance/{date}` | enregistre la journée entière (création ou mise à jour), renvoie la journée |
| GET | `/api/attendance/summary?from=&to=` | bilan par stagiaire ; `attendanceRate` vaut `null` sans jour pointé |
| GET | `/health` | santé de l'API et de la base |

Les dates sont au format `aaaa-mm-jj`. Une règle non respectée répond `400` avec un message en français par champ (`date`, `from`, `to`, `entries`). Corps du PUT :

```json
{ "entries": [ { "traineeId": 1, "status": "Present" }, { "traineeId": 2, "status": "Late" } ] }
```

`status` vaut `Present`, `Absent` ou `Late`.

## Pièges Next.js 16 déjà rencontrés

`next.config.ts` active `cacheComponents` et `partialPrefetching`. Conséquences :

- **Toute lecture de `searchParams` ou de l'API est sous une frontière `<Suspense>`** : chaque page affiche son titre tout de suite et lit l'URL puis appelle l'API dans un composant enfant.
- **« Aujourd'hui » se lit à la requête** : `new Date()` pendant le prérendu fait échouer la page. Les pages appellent `await connection()` avant `todayIso()`.
- **Next garde les pages précédentes, masquées, dans le DOM.** Deux pages qui ont un champ du même nom (`date`) auraient le même `id` et le `<label for>` pourrait viser le champ caché : on passe donc un `id` distinct par page (`InputField id=…`).
- Après l'enregistrement, React 19 réinitialise le formulaire : le formulaire se remplit depuis l'état renvoyé par l'action (`values`), sinon les choix de l'utilisateur seraient perdus après une erreur.
- `redirect()` fonctionne en levant une exception : appelez-le hors des `try/catch`. `error.tsx` reçoit la prop `retry`.
- `next build` : `API_BASE_URL` doit être définie.

## Choix et limites

- Pas d'authentification, pas de CORS.
- Fournisseur EF Core : le paquet officiel d'Oracle (`MySql.EntityFrameworkCore`), car Pomelo n'avait pas de version stable pour EF Core 10. Il lit les colonnes `date` en `DateTime` : `AppDbContext` convertit explicitement vers `DateOnly`.
- « Aujourd'hui » est la date locale du serveur (`TimeProvider` côté API, `Date` côté Next). Avec l'API et le front dans deux fuseaux différents, la date du jour pourrait différer d'une journée près de minuit.
- Deux premiers envois simultanés de la même date : le perdant reçoit l'erreur MySQL 1062, l'API recommence alors en mise à jour.
- La liste des stagiaires est fixe (insérée au démarrage) ; il n'y a pas de page pour en ajouter. Un stagiaire ajouté plus tard en base devrait figurer dans chaque envoi : l'API l'exige.
- Les types du front sont écrits à la main (`lib/api-client/types.ts`) : mettez-les à jour quand un DTO change.
- Conventions : identifiants et commentaires en anglais, textes affichés en français, commits en [Conventional Commits](https://www.conventionalcommits.org/).
