function InvestigateView(investigateModel) {
  // Compile template
  const investigate = $("#investigate-template").html();
  this.investigate_template_compiled = Handlebars.compile(investigate);
  this.investigateModel = investigateModel;

  this.anomalyID;
  this.anomaly;
  this.wowData;
  this.inves
  this.viewContributionClickEvent = new Event(this);

  this.investigateModel.renderViewEvent.attach(this.renderViewEventHandler.bind(this));
}

InvestigateView.prototype = {
  init(params = {}) {
    const { anomalyId } = params;
    if (this.anomalyId == anomalyId) {
      this.render();
    }
    this.anomalyId = anomalyId;
  },

  renderViewEventHandler() {
    this.setViewData();
    this.render();
  },

  setViewData() {
    this.anomaly = this.investigateModel.getAnomaly();
    const wowData = this.investigateModel.getWowData();
    const currentValue = wowData.currentVal;
    wowData.compareResults.forEach((result) => {
      result.change *= 100;
    });
    const [ wow, wow2, wow3 ] = wowData.compareResults;

    this.investigateData = {
      anomaly: this.anomaly,
      currentValue,
      wow,
      wow2,
      wow3
    };
  },

  render () {
    const template_with_anomaly = this.investigate_template_compiled(this.investigateData);
    $("#investigate-place-holder").html(template_with_anomaly);
    this.renderAnomalyChart(this.anomaly);
    // this.setupListenerOnViewContributionLink();
    this.setupListenerOnUserFeedback();
  },

  setupListenerOnViewContributionLink() {
    const anomaly = this.investigateModel.getAnomaly();
    $('.thirdeye-link').click((e) => {
      const wowType = e.target.id;
      const wowMapping = {
        wow1: 7,
        wow2: 14,
        wow3: 21
      };
      const offset = wowMapping[wowType] || 7;
      const currentStart = moment(anomaly.currentStart);
      const currentEnd = moment(anomaly.currentEnd);
      const granularity = this.getGranularity(currentStart, currentEnd);

      const analysisParams = {
        metricId: anomaly.metricId,
        currentStart,
        currentEnd,
        granularity,
        baselineStart: currentStart.clone().subtract(offset, 'days'),
        baselineEnd: currentEnd.clone().subtract(offset, 'days')
      };

      // if (anomaly.anomalyFunctionDimension.length) {
      //   const dimension = JSON.parse(anomaly.anomalyFunctionDimension);
      //   analysisParams.dimension = Object.keys(dimension)[0];
      // }
      this.viewContributionClickEvent.notify(analysisParams);
    });
  },

  setupListenerOnUserFeedback() {
    $('#feedback-radio-yes, #feedback-radio-no').click((event) => {
      const feedback = {
        yes: 'Confirmed Anomaly',
        no: 'False Alarm'
      }[event.target.value];

      $('#anomaly-feedback').html(`Resolved (${feedback})`);
    });
  },

  getGranularity(start, end) {
    const hoursDiff = end.diff(start, 'hours');
    if (hoursDiff < 3) {
      return '5_MINUTES';
    } else if (hoursDiff < 120) {
      return 'HOURS';
    } else {
      return 'DAYS';
    }
  },

  renderAnomalyChart(anomaly){
      const date = ['date'].concat(anomaly.dates);
      const currentValues = ['current'].concat(anomaly.currentValues);
      const baselineValues = ['baseline'].concat(anomaly.baselineValues);
      const chartColumns = [ date, currentValues, baselineValues ];
      const showPoints = date.length <= constants.MAX_POINT_NUM;


      // CHART GENERATION
      var chart = c3.generate({
        bindto : '#anomaly-investigate-chart',
        data : {
          x : 'date',
          xFormat : '%Y-%m-%d %H:%M',
          columns : chartColumns,
          type : 'line'
        },
        point: {
          show: showPoints,
        },
        legend : {
          position : 'inset',
          inset: {
            anchor: 'top-right',
          }
        },
        axis : {
          y : {
            show : true,
            tick: {
              format: d3.format(".2f")
            }
          },
          x : {
            type : 'timeseries',
            show : true,
            tick: {
              fit: false,
            }
          }
        },
        regions : [ {
          axis : 'x',
          start : anomaly.anomalyRegionStart,
          end : anomaly.anomalyRegionEnd,
          class: 'anomaly-region',
          tick : {
            format : '%m %d %Y'
          }
        } ]
      });
  }

};
