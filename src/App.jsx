import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import moment from 'moment';
import './index.css';

const DATA_KEY = 'arrival-times';

function App() {
  const [state, setState] = useState({
    arrivalTimes: [],
    currentDate: '',
    currentTimeString: '',
    primaryTarget: '',
    secondaryTarget: '',
    primaryLength: 0,
    secondaryLength: 0
  });

  useEffect(() => {
    updateState();
  }, []);

  const updateState = async () => {
    const currentTimeJson = new Date().toJSON();
    const result = await readData(currentTimeJson);

    let currentStartTime;
    if (_.isUndefined(result.currentStartTime)) {
      await storeNewTime(result.rawData, currentTimeJson);
      currentStartTime = moment(currentTimeJson);
    } else {
      currentStartTime = result.currentStartTime;
    }

    const times = calculateTimes(currentStartTime, currentTimeJson);

    setState({
      arrivalTimes: result.formatedData,
      currentDate: moment(currentTimeJson).format('dddd DD.MM.'),
      currentTimeString: times.currentTimeString,
      primaryTarget: times.primaryTarget.format('HH:mm'),
      secondaryTarget: times.secondaryTarget.format('HH:mm'),
      primaryLength: times.length,
      secondaryLength: times.length + 0.5
    });
  };

  const readData = async (currentTimeJson) => {
    let rawData = [];
    let data = [];
    let currentStartTime;

    try {
      const value = localStorage.getItem(DATA_KEY);
      if (value !== null) {
        rawData = JSON.parse(value);

        data = rawData.slice(0).reverse();
        if (data.length > 0 && data[0].slice(0, 10) == currentTimeJson.slice(0, 10)) {
          currentStartTime = moment(data[0]);
          data.shift();
        }

        data = data.map(d => moment(d).format('dddd DD.MM. HH:mm'));
      }
    } catch (error) {
      console.log(error);
    }

    return { rawData, formatedData: data, currentStartTime };
  };

  const storeNewTime = async (rawTimeData, newTimeJson) => {
    rawTimeData.push(newTimeJson);
    localStorage.setItem(DATA_KEY, JSON.stringify(rawTimeData));
  };

  const calculateTimes = (currentStartTime, currentTimeJson) => {
    const currentTimeString = currentStartTime.format('HH:mm') + " - " + currentStartTime.clone().add(480, 'minutes').format('HH:mm');
    const minutes = moment.duration(moment(currentTimeJson).diff(currentStartTime)).asMinutes();
    const baseLength = Math.floor(minutes / 30) * 30;
    const target1 = currentStartTime.clone().add(baseLength + 30, 'minutes');
    const target2 = currentStartTime.clone().add(baseLength + 60, 'minutes');
    let length = Math.floor(moment.duration(target1.diff(currentStartTime)).asMinutes()) / 60;

    //reduce lunch break
    if (length > 4.0)
      length -= 0.5;

    return { currentTimeString, primaryTarget: target1, secondaryTarget: target2, length };
  };

  return (
    <div className="container">
      <div className="current-day">
        <h1 className="header">
          {state.currentDate}
        </h1>
        <div className="header-detail">
          {state.currentTimeString} (7.5h)
        </div>
        <div className="header-detail">
          {state.primaryTarget} ({state.primaryLength}h)
        </div>
        <div className="header-detail">
          {state.secondaryTarget} ({state.secondaryLength}h)
        </div>
      </div>
      <div className="history-list">
        {state.arrivalTimes.map((time, index) => (
          <div key={`${time}-${index}`} className="start-time">
            {time}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
