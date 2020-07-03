import styled from "styled-components";

export const iScrollHeight = 15;

export const Div = styled.div`
  box-sizing: border-box;
  padding: 0px 20px 0px;
  height: calc(100vh - 50px);
  display: flex;
  flex-flow: column nowrap;
  .ant-spin-spinning{
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    overflow: hidden;
    z-index: 3;
  }
  .ant-spin-dot{
    margin-top: 45vh;
  }
  .ant-spin-dot-item{
    background: white;
  }
`;

export const WaveWrap = styled.div`
  /* margin-top: 30px; */
  width: 100%;
  background: yellow;
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;
  flex: none;
  canvas{
    position: absolute;
    top: 0;
    left: 0;
  }
  ::-webkit-scrollbar{
    height: ${iScrollHeight}px;
    background: #000;
  }
  ::-webkit-scrollbar-thumb{
    background: #00c800;
  }
`;

export const TimeBar = styled.div`
  position: relative;
  height: 100%;
  background: rgba(0,0,0,0.1);
  z-index: 2;
  display: flex;
  flex-flow: column nowrap;
`;

export const MarkWrap = styled.section`
  width: 100%;
  height: 20px;
  position: relative;
  flex: none;
  .second-mark{
    box-sizing: border-box;
    display: inline-block;
    border-left: solid 1px rgba(255,255,255,0.5);
    height: 80%;
    z-index: 3;
    position: absolute;
    bottom: 0;
    color: white;
    font-size: 12px;
    line-height: 1;
    padding: 0 0 2px 2px;
  }
`;

export const RegionWrap = styled.section`
  width: 100%;
  position: relative;
  flex: auto;
  border: solid green;
  border-width: 1px 0;
  overflow: hidden;
  .region{
    box-sizing: border-box;
    position: absolute;
    top: 0px;
    height: 100%;
    min-width: 1px;
    background: rgba(0,0,0,0.3);
    z-index: 4;
    margin: 0;
    padding: 0;
    border: solid rgba(255,255,255,0.6);
    border-width: 0 1px;
    overflow: hidden;
  }
  .cur{
    border-color: transparent blue transparent red;
    border-width: 0 2px;
    background: none;
    box-shadow: 0px 0 0px ${1000 * 100}px rgba(0, 0, 0, 0.4);
  }
  .idx{
    position: absolute;
    left: 5px;
    bottom: 1px;
    font-size: 12px;
    color: white;
  }
  .pointer{
    position: absolute;
    width: 1px;
    height: 100%;
    background: white;
    top: 0;
    left: 0;
    z-index: 9;
  }
`;

export const BtnBar = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 15px 0 0;
`;

export const InputWrap = styled.div`
  height: 90px;
  margin: 25px 0;
  flex: none;
  textarea{
    display: block;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 5px 10px;
    font-size: 20px;
    font-weight: bold;
    resize: none;
  }
`;

export const SentenceWrap = styled.ol`
  overflow-y: auto;
  list-style: none;
  padding: 0 0 100px;
  margin: 0;
  border-bottom: solid 1px #aaa;
  .one-line{
    line-height: 2.5;
    border: solid #aaa;
    border-width: 1px 0 0;
    padding: 0 10px;
    display: flex;
    font-size: 15px;
    &[class~=cur],
    &:hover{
      background: #ceffe7;
      cursor: pointer;
    }
    &:last-child{
      border-width: 1px 0;
    }
  }
  .idx{
    flex: none;
    font-style: normal;
    text-align: center;
  }
  .time{
    flex: none;
    border: solid 1px #aaa;
    border-width: 0 1px;
    padding: 0 0.6em;
    margin: 0 0.6em;
    em{
      font-style: normal;
    }
  }
`;

export const Steps = styled.ul`
  margin: 10px 0 0;
  display: flex;
  flex-flow: wrap row;
  outline: solid 1px #ccc;
  padding: 0;
  li{
    display: inline-block;
    padding: 0 10px;
  }
  .cur{
    background: yellow;
  }
`;