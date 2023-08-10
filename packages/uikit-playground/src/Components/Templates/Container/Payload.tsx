import { css } from '@rocket.chat/css-in-js';
import { Box, Message, Avatar, Button } from '@rocket.chat/fuselage';
import React, { useContext } from 'react';

import {
  context,
  templatesToggleAction,
  updatePayloadAction,
} from '../../../Context';
import RenderPayload from '../../Preview/Display/RenderPayload/RenderPayload';
import { ILayoutBlock } from '../../../Context/initialState';
import getUniqueId from '../../../utils/getUniqueId';

const Payload = ({ payload }: { payload: ILayoutBlock[] }) => {
  const { dispatch } = useContext(context);
  const clickHandler = () => {
    dispatch(templatesToggleAction(false));
    const payloadWithUniqueIds = payload.map((block) => {
      block.actionId = getUniqueId();
      return block;
    });
    dispatch(
      updatePayloadAction({
        payload: payloadWithUniqueIds,
        changedByEditor: false,
      })
    );
  };
  return (
    <>
      <Box
        onClick={clickHandler}
        border="1px solid #e6e6e6"
        padding="4px"
        borderRadius={12}
        className={css`
          cursor: pointer;
        `}
      >
        <Box
          className={css`
            pointer-events: none;
            &hover {
              box-shadow: var(--elements-box-shadow);
            }
          `}
        >
          <Message clickable>
            <Message.LeftContainer>
              <Avatar
                url="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC
                    4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMj
                    IyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAA
                    AAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAg
                    MREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6L
                    xqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVr
                    jbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRk
                    eX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef
                    6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkB
                    SuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlP
                    UH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z"
                size={'x36'}
              />
            </Message.LeftContainer>
            <Message.Container>
              <Message.Header>
                <Message.Name>Haylie George</Message.Name>
                <Message.Username>@haylie.george</Message.Username>
                <Message.Role>Admin</Message.Role>
                <Message.Role>User</Message.Role>
                <Message.Role>Owner</Message.Role>
                <Message.Timestamp>12:00 PM</Message.Timestamp>
              </Message.Header>
              <Message.Body>
                {payload.map((element) => (
                  <RenderPayload payload={[element]} />
                ))}
              </Message.Body>
            </Message.Container>
            <Message.Toolbox.Wrapper>
              <Message.Toolbox>
                <Message.Toolbox.Item icon="quote" />
                <Message.Toolbox.Item icon="clock" />
                <Message.Toolbox.Item icon="thread" />
              </Message.Toolbox>
            </Message.Toolbox.Wrapper>
          </Message>
        </Box>
      </Box>
      <Button onClick={clickHandler} primary mbs={'15px'} mbe={'25px'}>
        Use This Template
      </Button>
    </>
  );
};

export default Payload;
