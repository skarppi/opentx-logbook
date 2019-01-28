import { getType } from "typesafe-actions";
import { fetchFlight } from "../flights/actions";
import * as actions from "./actions";
import { RootAction } from "../store";
import { BatteryCycle } from "../../shared/batteries/types";

export type BatteryCycleState = Readonly<{
  batteries: { [key: string]: BatteryCycle };
  isLoadingBatteries: boolean;
}>;

const initialState: BatteryCycleState = {
  batteries: {},
  isLoadingBatteries: false
};

export const batteriesReducer = function reducer(
  state: BatteryCycleState = initialState,
  action: RootAction
) {
  switch (action.type) {
    case getType(fetchFlight.success): {
      const batteries = {};
      action.payload.batteries.forEach(battery => {
        batteries[battery.id] = battery;
      });

      return {
        ...state,
        batteries: batteries
      };
    }

    case getType(actions.insertBatteryCycle.request):
    case getType(actions.updateBatteryCycle.request):
    case getType(actions.deleteBatteryCycle.request): {
      return {
        ...state,
        isLoadingBatteries: true
      };
    }

    case getType(actions.insertBatteryCycle.success):
    case getType(actions.updateBatteryCycle.success): {
      return {
        ...state,
        batteries: {
          ...state.batteries,
          [action.payload.id]: action.payload
        },
        isLoadingBatteries: false
      };
    }

    case getType(actions.deleteBatteryCycle.success): {
      const batteries = { ...state.batteries };
      delete batteries[action.payload.id];
      return {
        ...state,
        batteries: batteries,
        isLoadingBatteries: false
      };
    }

    case getType(actions.insertBatteryCycle.failure):
    case getType(actions.updateBatteryCycle.failure):
    case getType(actions.deleteBatteryCycle.failure): {
      console.log(action.payload);
      return {
        ...state,
        isLoadingBatteries: false
      };
    }

    default:
      return state;
  }
};
