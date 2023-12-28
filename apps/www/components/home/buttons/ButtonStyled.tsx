import styled from 'styled-components';

export const ButtonStyled = styled.image<{}>`
  &:hover {
    background-color: #0cbaba;
    background-image: linear-gradient(315deg, #0cbaba 0%, #380036 74%);
    filter: sepia(1000%) hue-rotate(90deg) saturate(500%);
    cursor: pointer;
  }
`;
