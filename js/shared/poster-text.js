// Canonical Canvas/Circle text treatments, used by the standalone Canvas lab
// and every embedded lab. The controls and overlay markup live in the Canvas page.
(() => {
  const sourceURL=new URL(document.currentScript.src);
  const camel=id=>id.replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());
  function create({poster,wordmark,eventCopy,root}) {
    const document=root.ownerDocument;
    const controls=Object.fromEntries([...root.querySelectorAll('input[id],select[id],textarea[id]')].map(input=>[camel(input.id),input]));
    const outputs=Object.fromEntries([...root.querySelectorAll('output[id]')].map(output=>[camel(output.id.replace(/-output$/,'')),output]));
    const value=name=>Number(controls[name].value);
      function textElement(tagName, text, className = "") {
        const element = document.createElement(tagName);

        element.textContent = text;
        if (className) {
          element.className = className;
        }
        return element;
      }

      function syncEventCopy() {
        const variant = controls.eventCopyVariant.value;
        const kicker = eventCopy.querySelector(".event-kicker");
        const venue = eventCopy.querySelector(".event-venue");
        const speakers = eventCopy.querySelector(".speakers");
        const footer = eventCopy.querySelector(".event-footer");

        eventCopy.dataset.copyVariant = variant;
        wordmark.parentElement.dataset.copyVariant = variant;
        document.querySelector("[data-manifesto-controls]").hidden = variant !== "manifesto";
        root.querySelector('[data-custom-copy-controls]').hidden=variant!=='custom';
        venue.style.fontSize = "";
        venue.style.lineHeight = "";
        venue.style.letterSpacing = "";
        syncPlacement();
        if (['logo','none','custom'].includes(variant)) {
          kicker.replaceChildren(); speakers.replaceChildren(); footer.replaceChildren();
          venue.textContent=variant==='custom'?controls.customCopy.value:'';
          eventCopy.setAttribute('aria-label',variant==='custom'?controls.customCopy.value:'');
          syncCopyTypography(); return;
        }
        venue.removeAttribute("lang");

        if (variant === "manifesto-title") {
          kicker.replaceChildren();
          speakers.replaceChildren();
          footer.replaceChildren();
          const top = textElement("span", "", "manifesto-title-top");
          const no = textElement("span", "NO");
          const somos = textElement("span", "SOMOS");
          const bottom = textElement("span", "ESPECTADORES", "manifesto-title-bottom");
          [no, somos, bottom].forEach(span => span.dataset.exportText = "");
          top.append(no, document.createTextNode(" "), somos);
          venue.replaceChildren(top, bottom);
          venue.setAttribute("lang", "es");
          venue.setAttribute("aria-label", "NO SOMOS ESPECTADORES");
          eventCopy.setAttribute("aria-label", "NO SOMOS ESPECTADORES");
          syncCopyTypography();
          return;
        }

        if (variant === "manifesto") {
          kicker.replaceChildren();
          speakers.replaceChildren();
          footer.replaceChildren();
          venue.replaceChildren(textElement("span", "MANIFESTO", "manifesto-line"));
          venue.setAttribute("aria-label", "MANIFESTO");
          eventCopy.setAttribute("aria-label", "MANIFESTO");
          syncCopyTypography();
          return;
        }

        if (variant === "logo-renaissance") {
          kicker.replaceChildren();
          speakers.replaceChildren();
          footer.replaceChildren();
          venue.replaceChildren(
            textElement("span", "NEW RENAISSANCE", "logo-renaissance-line")
          );
          venue.setAttribute("aria-label", "New Renaissance");
          eventCopy.setAttribute("aria-label", "New Renaissance");
          syncCopyTypography();
          return;
        }

        if (variant === "renaissance") {
          const dates = textElement("p", "", "renaissance-dates");

          kicker.replaceChildren();
          venue.replaceChildren(
            textElement(
              "span",
              "The New Renaissance",
              "renaissance-title-line"
            )
          );
          venue.setAttribute("aria-label", "The New Renaissance");
          dates.replaceChildren(
            textElement(
              "span",
              "November 2026",
              "renaissance-date"
            ),
            textElement(
              "span",
              "January 2028",
              "renaissance-date"
            )
          );
          dates.setAttribute(
            "aria-label",
            "November 2026 to January 2028"
          );
          speakers.replaceChildren(dates);
          footer.replaceChildren(
            textElement(
              "span",
              "Meaning and Art in the age of AI",
              "renaissance-footnote"
            ),
            textElement("span", "beartgroup.com")
          );
          eventCopy.setAttribute(
            "aria-label",
            "The New Renaissance exhibition details"
          );
          syncCopyTypography();
          return;
        }

        kicker.replaceChildren(
          textElement("span", "Join us"),
          textElement("span", "November 4")
        );
        venue.replaceChildren(
          document.createTextNode("At Museo Nacional"),
          document.createElement("br"),
          textElement("span", "Thyssen‑Bornemisza")
        );
        venue.removeAttribute("aria-label");
        const firstGuests = document.createElement("ul");
        const secondGuests = document.createElement("ul");

        firstGuests.replaceChildren(
          textElement("li", "Lucía Ferrer"),
          textElement("li", "Mina Park")
        );
        secondGuests.replaceChildren(
          textElement("li", "Omar Diallo"),
          textElement("li", "Théo Laurent")
        );
        speakers.replaceChildren(
          textElement("p", "With"),
          firstGuests,
          secondGuests
        );
        footer.replaceChildren(
          textElement("span", "Discover more"),
          textElement("span", "beartgroup.com")
        );
        eventCopy.setAttribute("aria-label", "Event details");
      }

      function fitTrackedLine(element, container) {
        if (!element || !container) {
          return;
        }

        element.style.letterSpacing = "0px";
        const availableWidth = container.getBoundingClientRect().width;
        const naturalWidth = element.getBoundingClientRect().width;
        const characterCount = Array.from(element.textContent.trim()).length;

        if (
          availableWidth <= 0 ||
          naturalWidth <= 0 ||
          characterCount < 2
        ) {
          return;
        }

        const tracking = Math.max(
          0,
          (availableWidth - naturalWidth) / (characterCount - 1)
        );

        element.style.letterSpacing = `${tracking}px`;
      }

      function syncCopyTypography() {
        syncPlacement();
        if (controls.eventCopyVariant.value==='custom') {
          const venue=eventCopy.querySelector('.event-venue');
          venue.style.fontSize=`${value('customFontSize')}cqw`;
          venue.style.lineHeight=controls.customLineHeight.value;
          venue.style.letterSpacing=`${value('customTracking')}em`;
        }
        document.querySelector("#manifesto-font-size-output").value = `${controls.manifestoFontSize.value} px`;
        document.querySelector("#manifesto-font-weight-output").value = controls.manifestoFontWeight.value;
        if (controls.eventCopyVariant.value === "manifesto-title") {
          const venue = eventCopy.querySelector(".event-venue");
          const bottom = venue.querySelector(".manifesto-title-bottom");
          const availableWidth = eventCopy.getBoundingClientRect().width;
          if (!bottom || availableWidth <= 0) return;
          // Use the same font size for both rows; the top row expands its space.
          venue.style.fontSize = "100px";
          const naturalWidth = bottom.getBoundingClientRect().width;
          venue.style.fontSize = naturalWidth > 0
            ? `${100 * availableWidth / naturalWidth}px`
            : "";
          return;
        }
        if (controls.eventCopyVariant.value === "manifesto") {
          const line = eventCopy.querySelector(".manifesto-line");
          if (line) {
            line.style.fontSize = `${value("manifestoFontSize") / 12}cqw`;
            line.style.fontWeight = controls.manifestoFontWeight.value;
          }
          return;
        }
        if (controls.eventCopyVariant.value === "logo-renaissance") {
          const line = eventCopy.querySelector(".logo-renaissance-line");
          const availableWidth = wordmark.getBoundingClientRect().width;

          if (!line || availableWidth <= 0) return;
          // Measure at a fixed size so repeated resizing never compounds rounding.
          line.style.fontSize = "100px";
          const naturalWidth = line.getBoundingClientRect().width;
          line.style.fontSize = naturalWidth > 0
            ? `${100 * availableWidth / naturalWidth}px`
            : "";
          return;
        }
        if (controls.eventCopyVariant.value !== "renaissance") {
          return;
        }

        const titleLine = eventCopy.querySelector(
          ".renaissance-title-line"
        );

        fitTrackedLine(titleLine, titleLine?.parentElement);
      }

      function syncTextEffects() {
        wordmark.parentElement.dataset.verticalAlign =
          controls.textVerticalAlign.value;
        const eventEffect = controls.eventTextEffect.value;
        const logoEffect = controls.logoEffect.value;
        const strength = value("logoEffectStrength") / 100;
        const opacity = value("logoEffectOpacity") / 100;
        const eventAccent = controls.eventTextAccent.value;
        const eventOpacity = value("eventTextOpacity") / 100;
        const matchAccent = controls.matchTextAccent.checked;
        const logoAccent = matchAccent
          ? eventAccent
          : controls.logoAccent.value;
        const accentLogoEffects = [
          "accent",
          "difference",
          "hypercolor",
          "hue"
        ];
        const adjustableLogoEffects = [
          "invert",
          "difference",
          "glass",
          "hypercolor",
          "hue"
        ];

        eventCopy.dataset.textEffect = eventEffect;
        eventCopy.style.setProperty("--text-accent", eventAccent);
        eventCopy.style.setProperty("--text-opacity", eventOpacity);
        wordmark.dataset.logoEffect = logoEffect;
        wordmark.style.setProperty("--logo-accent", logoAccent);
        wordmark.style.setProperty("--logo-opacity", opacity);
        wordmark.style.setProperty(
          "--effect-alpha",
          strength * opacity
        );
        wordmark.style.setProperty(
          "--effect-blur",
          `${controls.logoEffectBlur.value}px`
        );
        wordmark.style.setProperty(
          "--effect-saturation",
          `${100 + strength * (logoEffect === "hypercolor" ? 260 : 80)}%`
        );
        wordmark.style.setProperty(
          "--effect-contrast",
          `${100 + strength * (logoEffect === "hypercolor" ? 45 : 20)}%`
        );
        wordmark.style.setProperty(
          "--effect-brightness",
          `${100 + strength * 10}%`
        );
        wordmark.style.setProperty(
          "--effect-hue",
          `${value("logoEffectHue") * strength}deg`
        );
        wordmark.style.setProperty(
          "--glass-alpha",
          (0.04 + strength * 0.22).toFixed(2)
        );
        wordmark.style.setProperty(
          "--fallback-alpha",
          ((0.18 + strength * 0.42) * opacity).toFixed(2)
        );

        outputs.eventTextAccent.value = eventAccent.toUpperCase();
        outputs.eventTextOpacity.value =
          `${controls.eventTextOpacity.value}%`;
        outputs.logoAccent.value = logoAccent.toUpperCase();
        outputs.logoEffectStrength.value =
          `${controls.logoEffectStrength.value}%`;
        outputs.logoEffectBlur.value =
          `${controls.logoEffectBlur.value} px`;
        outputs.logoEffectHue.value = `${controls.logoEffectHue.value}°`;
        outputs.logoEffectOpacity.value =
          `${controls.logoEffectOpacity.value}%`;

        controls.logoAccent.disabled = matchAccent;
        document.querySelector("[data-event-accent-control]").hidden =
          !["difference", "accent"].includes(eventEffect);
        document.querySelector("[data-logo-accent-control]").hidden =
          matchAccent || !accentLogoEffects.includes(logoEffect);
        document.querySelector("[data-logo-strength-control]").hidden =
          !adjustableLogoEffects.includes(logoEffect);
        document.querySelector("[data-logo-blur-control]").hidden =
          logoEffect !== "glass";
        document.querySelector("[data-logo-hue-control]").hidden =
          logoEffect !== "hue";
      }


    function syncPlacement() {
      const copy=wordmark.parentElement,positioned=controls.textLayout.value==='positioned';
      copy.dataset.layout=controls.textLayout.value;
      root.querySelector('[data-text-placement-controls]').hidden=!positioned;
      for (const [name,key] of [['width','textWidth'],['x','textX'],['y','textY']]) copy.style.setProperty(`--text-block-${name}`,`${value(key)}%`);
      copy.style.setProperty('--text-block-half-height',`${copy.getBoundingClientRect().height/2}px`);
      copy.style.setProperty('--text-align',controls.textAlign.value);
      copy.dataset.customFont=String(controls.textFontFamily.value!=='original');
      copy.dataset.customWeight=String(controls.textFontWeight.value!=='original');
      eventCopy.style.fontFamily=controls.textFontFamily.value==='original'?'':controls.textFontFamily.value;
      copy.style.setProperty('--chosen-text-weight',controls.textFontWeight.value==='original'?'400':controls.textFontWeight.value);
    }
    function getState() {
      return Object.fromEntries(Object.entries(controls).map(([key,input])=>[key,input.type==='checkbox'?input.checked:['range','number'].includes(input.type)?Number(input.value):input.value]));
    }
    function validateState(input) {
      if (!input || typeof input!=='object' || Array.isArray(input) || Object.keys(input).length!==Object.keys(controls).length || Object.keys(controls).some(key=>!Object.hasOwn(input,key))) throw new TypeError('Expected complete text settings.');
      for (const [key,control] of Object.entries(controls)) {
        const value=input[key];
        if (control.type==='checkbox') {if(typeof value!=='boolean') throw new TypeError(`Invalid text setting: ${key}.`);}
        else if (['range','number'].includes(control.type)) {
          if(typeof value!=='number'||!Number.isFinite(value)||value<Number(control.min)||value>Number(control.max)) throw new TypeError(`Invalid text setting: ${key}.`);
        } else if (typeof value!=='string' || value.length>2000 || (control.type==='color'&&!/^#[0-9a-f]{6}$/.test(value)) || (control.tagName==='SELECT'&&![...control.options].some(option=>option.value===value))) throw new TypeError(`Invalid text setting: ${key}.`);
      }
      return {...input};
    }
    function sync(){syncEventCopy();syncTextEffects();syncCopyTypography();}
    function setState(input) {
      const next=validateState(input);
      for (const [key,value] of Object.entries(next)) {
        const control=controls[key];
        if (control.type==='checkbox')control.checked=value;else control.value=value;
      }
      sync(); return getState();
    }
    root.addEventListener('input',sync);root.addEventListener('change',sync);
    const observer=window.ResizeObserver?new ResizeObserver(syncCopyTypography):null;observer?.observe(poster);observer?.observe(wordmark.parentElement);
    document.fonts?.ready.then(syncCopyTypography);
    document.fonts?.addEventListener('loadingdone',syncCopyTypography);
    const api={controls,outputs,syncEventCopy,syncTextEffects,syncCopyTypography,getState,validateState,setState,
      dispose(){observer?.disconnect();document.fonts?.removeEventListener('loadingdone',syncCopyTypography);root.removeEventListener('input',sync);root.removeEventListener('change',sync);}};
    window.PosterTextHost=api;
    return api;
  }
  async function mountEmbedded(bridge) {
    const canonical=new URL('../../canvas_light_columns_demo.html',sourceURL);
    const response=await fetch(canonical);
    if(!response.ok)throw new Error('Could not load the original text controls.');
    const source=new DOMParser().parseFromString(await response.text(),'text/html');
    const root=source.querySelector('#text-controls'),copy=source.querySelector('#poster-copy');
    if(!root||!copy)throw new Error('The original text treatment is unavailable.');
    for(const image of copy.querySelectorAll('[src]'))image.src=new URL(image.getAttribute('src'),canonical).href;
    const panel=document.createElement('section');panel.className='shared-text-panel';panel.append(root);bridge.controls.append(panel);
    bridge.surface.append(copy);bridge.surface.style.containerType='inline-size';
    const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./poster-text.css?v=native-5',sourceURL);document.head.append(style);
    const api=create({poster:bridge.surface,wordmark:copy.querySelector('#wordmark'),eventCopy:copy.querySelector('#event-copy'),root});
    api.setState({...api.getState(),eventCopyVariant:'logo',logoEffect:'solid-white',textLayout:'positioned',textWidth:62});
    return api;
  }
  window.PosterText={create,mountEmbedded};
})();
