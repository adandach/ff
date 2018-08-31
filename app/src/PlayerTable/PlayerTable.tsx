import * as React from "react";
import { connect } from "react-redux";

import { IPlayer, Position } from "../Player";
import {
  removePlayer,
  selectPlayer,
  undoPlayerPick
} from "../store/actions/players";
import { incrementDraft, pickPlayer } from "../store/actions/teams";
import { getPlayers } from "../store/reducers/players";
import { IStoreState } from "../store/store";
import { TeamPlayer } from "../Team";

import "./PlayerTable.css";

interface IProps {
  byeWeeks: { [key: number]: boolean };
  currentPick: number;
  mobile?: boolean;
  undraftedPlayers: any[];
  pickPlayer: (player: IPlayer) => void;
  ppr: boolean;
  rbHandcuffTeams: { [key: string]: boolean };
  removePlayer: (player: IPlayer) => void;
  selectPlayer: (player: IPlayer) => void;
  skip: () => void;
  undo: () => void;
  valuedPositions: { [key: string]: boolean };
}

interface IState {
  positionsToShow: Position[];
}

/**
 * A table displaying all the undrafted players
 *
 * Includes buttons for skipping the current round, without a pick,
 * and undoing the last round/pick (in the event of a mistake)
 */
class PlayerTable extends React.Component<IProps, IState> {
  public static defaultProps = {
    mobile: false
  };

  public state: IState = {
    positionsToShow: ["?"] // ? is a hackish flag for "ALL"
  };

  /** All possible positions. ? Means any position, don't filter */
  private possiblePositions: Position[] = [
    "?",
    "QB",
    "RB",
    "WR",
    "TE",
    "DST",
    "K"
  ];

  public render() {
    const {
      currentPick,
      mobile,
      ppr,
      rbHandcuffTeams,
      undraftedPlayers
    } = this.props;
    const { positionsToShow } = this.state;

    const playersToRender =
      positionsToShow.length === 1 && positionsToShow[0] === "?"
        ? undraftedPlayers
        : undraftedPlayers.filter(p => positionsToShow.indexOf(p.pos) > -1);

    const draftSoon = playersToRender.map(
      p => p.adp && currentPick + 10 > p.adp
    );

    return (
      <div className="PlayerTable Section">
        <div id="table-top-header" className="Stick-Section">
          <header>
            {!mobile && <h3>Players</h3>}

            {/* Buttons for filtering on position */}
            <div className="PlayerTable-Position-Buttons">
              {this.possiblePositions.map(p => (
                <button
                  key={p}
                  className={positionsToShow.indexOf(p) > -1 ? "Active" : ""}
                  onClick={() => this.setPositionFilter(p)}
                >
                  {p === "?" ? "All" : p}
                </button>
              ))}
            </div>

            {/* Buttons for skipping and undoing actions */}
            <div className="Player-Table-Control-Buttons">
              {!mobile && (
                <button
                  className="Grayed skip-button"
                  onClick={this.props.skip}
                >
                  Skip
                </button>
              )}

              <button className="Grayed undo-button" onClick={this.props.undo}>
                Undo
              </button>
            </div>
          </header>

          {/* Legend for dots on the row */}
          <div className="Legend-Row">
            <div className="green-dot" />
            <p className="small">Will be drafted soon</p>
            {!mobile && (
              <>
                <div className="orange-dot" />
                <p className="small">BYE week conflict with starter</p>
                <div className="red-dot" />
                <p className="small">RB handcuff</p>
              </>
            )}
          </div>
          <div id="table-head">
            <div className="col col-name">
              <p>Name</p>
            </div>
            <p className="col col-pos">Position</p>
            <p className="col col-team">Team</p>
            <p className="col col-bye">Bye Week</p>
            <p className="col col-vor" data-tip="Value over replacement">
              VOR
            </p>
            <p
              className="col col-prediction"
              data-tip="Average of expert predictions (ESPN, FOX, CBS, NFL)"
            >
              Prediction
            </p>

            {/* Table headers not rendered on mobile */}
            {!mobile && (
              <>
                <p
                  className="col col-adp"
                  data-tip="Average draft position (Fantasy Football Calculator)"
                >
                  ADP
                </p>
                <p
                  className="col col-madden"
                  data-tip="Madden 2019 Overall player stat"
                >
                  Madden
                </p>
                <p className="col col-remove">Remove</p>
              </>
            )}
          </div>
        </div>

        <div id="table">
          <div id="table-body">
            {playersToRender.map((p: IPlayer, i) => (
              <div
                key={p.name + p.pos + p.team}
                onClick={() => this.props.pickPlayer(p)}
                className={
                  this.props.valuedPositions[p.pos] || mobile
                    ? "row"
                    : "row row-inactive"
                }
              >
                <div className="col col-name">
                  <p>{p.name} </p>
                  {/* Add dots for information on bye week */}
                  {draftSoon[i] ? <div className="dot green-dot" /> : null}{" "}
                  {this.props.byeWeeks[p.bye] &&
                    !mobile && <div className="dot orange-dot" />}
                  {p.pos === "RB" &&
                    rbHandcuffTeams[p.team] &&
                    !mobile && <div className="dot red-dot" />}
                </div>
                <p className="col col-pos">{p.pos}</p>
                <p className="col col-team">{p.team}</p>
                <p className="col col-bye">{p.bye}</p>
                <p className="col col-vor">{p.vor}</p>
                <p className="col col-prediction">
                  {ppr ? p.predictionPPR : p.predictionSTN}
                </p>

                {/* Table data not rendered on mobile */}
                {!mobile && (
                  <>
                    <p className="col col-adp">{p.adp}</p>
                    <p className="col col-madden">{p.madden}</p>
                    <button
                      className="remove-player-x col col-remove"
                      onClick={e => {
                        e.stopPropagation();
                        this.props.removePlayer(p);
                      }}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /**
   * update the allowable positions in state, used to filter out players by position
   */
  private setPositionFilter = (position: Position) => {
    let { positionsToShow } = this.state;

    // if it's ?, clear anything else
    if (position === "?") {
      this.setState({ positionsToShow: ["?"] });
    } else if (positionsToShow.indexOf(position) > -1) {
      positionsToShow = positionsToShow.filter(p => p !== position);
      this.setState({
        positionsToShow: positionsToShow.length ? positionsToShow : ["?"]
      });
    } else {
      positionsToShow = positionsToShow.filter(p => p !== "?");
      this.setState({
        positionsToShow: positionsToShow.concat([position])
      });
    }
  };
}

const mapStateToProps = (state: IStoreState) => {
  const { QB, RB, WR, TE, FLEX, DST, K } = state.teams[state.trackedTeam];

  // add the positions to the object that the trackedTeam hasn't
  // filled their roster with (ie they have space for)
  const notFilled = (pos: TeamPlayer[]) => !pos.every((p: IPlayer) => !!p);
  const valuedPositions = {} as any;
  if (notFilled(QB)) {
    valuedPositions.QB = true;
  }
  if (notFilled(RB)) {
    valuedPositions.RB = true;
  }
  if (notFilled(WR)) {
    valuedPositions.WR = true;
  }
  if (notFilled(FLEX)) {
    valuedPositions.RB = true;
    valuedPositions.WR = true;
  }
  if (notFilled(TE)) {
    valuedPositions.TE = true;
  }

  // after one of each main starter has been drafted, everything is valued
  if (!Object.keys(valuedPositions).length) {
    ["QB", "RB", "WR", "TE"].forEach(p => (valuedPositions[p] = true));
  }

  // only want one of each K and DST, none on bench
  if (notFilled(K)) {
    valuedPositions.K = true;
  }
  if (notFilled(DST)) {
    valuedPositions.DST = true;
  }

  // find the bye weeks already taken by the core players (QB, RB, WR, FLEX)
  const byeWeeks = [...QB, ...RB, ...WR, ...FLEX]
    .map(p => p && p.bye)
    .reduce((acc, bye) => (bye ? { ...acc, [bye]: true } : acc), {});

  // find the teams of the rbs, other rbs on these teams will be handcuffs
  const rbHandcuffTeams = [...RB, ...FLEX]
    .filter((p: IPlayer) => p && p.pos === "RB")
    .reduce((acc, p: IPlayer) => ({ ...acc, [p.team]: true }), {});

  return {
    byeWeeks,
    currentPick: state.currentPick,
    ppr: state.ppr,
    rbHandcuffTeams,
    undraftedPlayers: getPlayers(state),
    valuedPositions
  };
};

const mapDispatchToProps = (dispatch: any) => ({
  pickPlayer: (player: IPlayer) => dispatch(pickPlayer(player)),
  removePlayer: (player: IPlayer) => dispatch(removePlayer(player)),
  selectPlayer: (player: IPlayer) => dispatch(selectPlayer(player)),
  skip: () => dispatch(incrementDraft()),
  undo: () => dispatch(undoPlayerPick())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PlayerTable);
