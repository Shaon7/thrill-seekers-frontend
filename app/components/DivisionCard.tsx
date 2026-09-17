"use client"; 
 
import { 
  ArrowRight, 
  Shield, 
  TrendingUp, 
} from "lucide-react"; 
import { useRouter } from "next/navigation"; 
 
interface Division { 
  id: number; 
  divisionId: string; 
  competitionId: string; 
  NumberOfPlayer: number | null; 
  season: number; 
  phase: number; 
  divisionNumber: number; 
  name: string; 
 
  players?: { 
    id: number; 
    playerId: string; 
    name: string; 
  }[]; 
} 
 
interface PointTableRow { 
  id: number; 
  competitionId: string; 
  playerId: string; 
 
  played: number; 
  won: number; 
  drawn: number; 
  lost: number; 
 
  goalsFor: number; 
  goalsAgainst: number; 
  goalDifference: number; 
 
  points: number; 
} 
 
interface DivisionCardProps { 
  division: Division | null; 
  playerId?: string; 
  pointTables: PointTableRow[]; 
  loading?: boolean; 
} 
 
export default function DivisionCard({ 
  division, 
  playerId, 
  pointTables, 
  loading = false, 
}: DivisionCardProps) { 
  const router = useRouter(); 
 
  if (loading) { 
    return ( 
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-8"> 
        <div className="relative animate-pulse"> 
 
          <div className="flex items-center justify-between"> 
            <div className="h-12 w-12 rounded-2xl bg-yellow-400/5" /> 
 
            <div className="h-6 w-28 rounded-full bg-yellow-400/5" /> 
          </div> 
 
          <div className="mt-6 h-3 w-28 rounded bg-yellow-400/5" /> 
 
          <div className="mt-3 h-8 w-64 rounded bg-yellow-400/5" /> 
 
          <div className="mt-2 h-4 w-72 rounded bg-yellow-400/5" /> 
 
          <div className="mt-7 grid grid-cols-3 gap-3"> 
            <div className="h-20 rounded-xl bg-yellow-400/5" /> 
            <div className="h-20 rounded-xl bg-yellow-400/5" /> 
            <div className="h-20 rounded-xl bg-yellow-400/5" /> 
          </div> 
 
          <div className="mt-5 h-5 w-52 rounded bg-yellow-400/5" /> 
 
          <div className="mt-5 h-12 w-full rounded-xl bg-yellow-400/5" /> 
        </div> 
      </div> 
    ); 
  } 
 
  if (!division) { 
    return ( 
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-8"> 
        <div className="relative"> 
 
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10 text-yellow-400"> 
            <Shield size={24} /> 
          </div> 
 
          <p className="mt-6 text-xs font-semibold tracking-[0.2em] text-yellow-400"> 
            CURRENT DIVISION 
          </p> 
 
          <h3 className="mt-2 text-2xl font-bold"> 
            No Active Division 
          </h3> 
 
          <p className="mt-1 text-sm text-zinc-500"> 
            There is no active division 
            available at the moment. 
          </p> 
 
        </div> 
      </div> 
    ); 
  } 
 
  const sortedTable = 
    [...pointTables].sort( 
      (a, b) => { 
        if ( 
          b.points !== 
          a.points 
        ) { 
          return ( 
            b.points - 
            a.points 
          ); 
        } 
 
        if ( 
          b.goalDifference !== 
          a.goalDifference 
        ) { 
          return ( 
            b.goalDifference - 
            a.goalDifference 
          ); 
        } 
 
        if ( 
          b.goalsFor !== 
          a.goalsFor 
        ) { 
          return ( 
            b.goalsFor - 
            a.goalsFor 
          ); 
        } 
 
        return a.playerId.localeCompare( 
          b.playerId 
        ); 
      } 
    ); 
 
  const playerIndex = 
    sortedTable.findIndex( 
      (row) => 
        row.playerId === 
        playerId 
    ); 
 
  const playerRow = 
    playerIndex >= 0 
      ? sortedTable[ 
          playerIndex 
        ] 
      : null; 
 
  const position = 
    playerIndex >= 0 
      ? playerIndex + 1 
      : null; 
 
  const firstPlace = 
    sortedTable[0] ?? null; 
 
  const pointsAway = 
    playerRow && 
    firstPlace 
      ? Math.max( 
          0, 
          firstPlace.points - 
            playerRow.points 
        ) 
      : 0; 
 
  const trendText = 
    position === 1 
      ? "You are in top place" 
      : position !== null && 
        firstPlace 
      ? `${pointsAway} ${ 
          pointsAway === 1 
            ? "point" 
            : "points" 
        } away from first place` 
      : "Your division statistics are not available yet"; 
 
  return ( 
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-8"> 
 
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-yellow-400/5 blur-3xl" /> 
 
      <div className="relative"> 
 
        <div className="flex items-center justify-between"> 
 
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10 text-yellow-400"> 
            <Shield size={24} /> 
          </div> 
 
          <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-400"> 
            SEASON ACTIVE 
          </span> 
 
        </div> 
 
        <p className="mt-6 text-xs font-semibold tracking-[0.2em] text-yellow-400"> 
          CURRENT DIVISION 
        </p> 
 
        <h3 className="mt-2 text-2xl font-bold"> 
          {division.name || 
            `Division ${division.divisionNumber}`} 
        </h3> 
 
        <p className="mt-1 text-sm text-zinc-500"> 
          Season {division.season}- 
          {division.season + 1} 
          {" • "} 
          Phase {division.phase} 
        </p> 
 
        <div className="mt-7 grid grid-cols-3 gap-3"> 
 
          <div className="rounded-xl border border-white/10 bg-black/20 p-3"> 
            <p className="text-xl font-bold"> 
              {position 
                ? `#${position}` 
                : "-"} 
            </p> 
 
            <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500"> 
              Position 
            </p> 
          </div> 
 
          <div className="rounded-xl border border-white/10 bg-black/20 p-3"> 
            <p className="text-xl font-bold"> 
              {playerRow?.points ?? 
                0} 
            </p> 
 
            <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500"> 
              Points 
            </p> 
          </div> 
 
          <div className="rounded-xl border border-white/10 bg-black/20 p-3"> 
            <p className="text-xl font-bold"> 
              {playerRow?.played ?? 
                0} 
            </p> 
 
            <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500"> 
              Matches 
            </p> 
          </div> 
 
        </div> 
 
        <div className="mt-5 flex items-center gap-2 text-sm text-yellow-400"> 
          <TrendingUp size={17} /> 
 
          <span className="font-medium"> 
            {trendText} 
          </span> 
        </div> 
 
        <button 
          onClick={() => 
            router.push("/division") 
          } 
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-400 transition hover:bg-yellow-400/20" 
        > 
          View Division 
          <ArrowRight size={17} /> 
        </button> 
 
      </div> 
    </div> 
  ); 
}

